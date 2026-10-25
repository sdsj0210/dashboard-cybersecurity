const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const target = require.resolve("../src/jobs/dailySync");

const iso = (date) => date.toISOString().slice(0, 10);
const plusDays = (value, days) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return iso(date);
};
const yesterday = () => plusDays(iso(new Date()), -1);

function loadWithMocks(dependencies) {
  const originalLoad = Module._load;
  delete require.cache[target];
  try {
    Module._load = function (request, parent, isMain) {
      if (parent?.filename === target && Object.hasOwn(dependencies, request)) {
        return dependencies[request];
      }
      return originalLoad.apply(this, arguments);
    };
    return require(target);
  } finally {
    Module._load = originalLoad;
    delete require.cache[target];
  }
}

function setup(t, { ranges = [], modified, published, getRangesError } = {}) {
  const calls = { scheduled: [], modified: [], published: [], jobs: [], errors: [], logs: [] };
  let busy = false;

  class SyncInProgressError extends Error {}

  const repository = {
    async getSyncRanges() {
      if (getRangesError) throw getRangesError;
      return ranges;
    },
  };
  const service = {
    async syncModifiedCves(from, to) {
      calls.modified.push([from, to]);
      return modified ? modified(from, to) : { synchronized: 3 };
    },
    async syncCves(from, to) {
      calls.published.push([from, to]);
      return published ? published(from, to) : { synchronized: 2 };
    },
  };
  const coordinator = {
    SyncInProgressError,
    async runExclusiveSync(task) {
      if (busy) throw new SyncInProgressError("Ya hay una sincronización en curso");
      busy = true;
      const job = (async () => {
        try {
          return await task();
        } finally {
          busy = false;
        }
      })();
      // Permite observar cuándo termina incluso si la tarea simulada falla.
      calls.jobs.push(job.then(() => undefined, () => undefined));
      return job;
    },
  };
  const cron = {
    schedule(expression, callback, options) {
      calls.scheduled.push({ expression, callback, options });
      return { stop() {} };
    },
  };
  t.mock.method(console, "log", (...args) => calls.logs.push(args));
  t.mock.method(console, "error", (...args) => calls.errors.push(args));
  const { startDailySync } = loadWithMocks({
    "node-cron": cron,
    "../services/cveService": service,
    "../repositories/cveRepository": repository,
    "../services/syncCoordinator": coordinator,
  });
  return { startDailySync, calls, coordinator };
}

test("programa cron a las 02:00 de Canarias y sincroniza al arrancar", async (t) => {
  const { startDailySync, calls } = setup(t);
  startDailySync();
  assert.equal(calls.scheduled.length, 1);
  assert.equal(calls.scheduled[0].expression, "0 2 * * *");
  assert.deepEqual(calls.scheduled[0].options, {
    timezone: "Atlantic/Canary",
    noOverlap: true,
  });
  assert.equal(calls.jobs.length, 1);
  await calls.jobs[0];
});

test("sin rangos previos consulta solamente el último día completo", async (t) => {
  const { startDailySync, calls } = setup(t);
  startDailySync();
  await calls.jobs[0];
  assert.deepEqual(calls.modified, [[yesterday(), yesterday()]]);
  assert.deepEqual(calls.published, [[yesterday(), yesterday()]]);
});

test("recupera días pendientes en bloques consecutivos de máximo siete días", async (t) => {
  const last = plusDays(yesterday(), -15);
  const { startDailySync, calls } = setup(t, {
    ranges: [{ start_date: plusDays(last, -2), end_date: last }],
  });
  startDailySync();
  await calls.jobs[0];
  const start = plusDays(last, -2);
  assert.deepEqual(calls.modified, [
    [start, plusDays(start, 6)],
    [plusDays(start, 7), plusDays(start, 13)],
    [plusDays(start, 14), yesterday()],
  ]);
  assert.deepEqual(calls.published, calls.modified);
});

test("elige la fecha más reciente y descarta periodos futuros", async (t) => {
  const last = plusDays(yesterday(), -3);
  const { startDailySync, calls } = setup(t, {
    ranges: [
      { end_date: plusDays(yesterday(), 5) },
      { end_date: plusDays(yesterday(), -10) },
      { end_date: last },
    ],
  });
  startDailySync();
  await calls.jobs[0];
  assert.deepEqual(calls.modified, [[plusDays(last, -2), yesterday()]]);
});

test("procesa primero modificaciones y después publicaciones de cada bloque", async (t) => {
  const order = [];
  const { startDailySync, calls } = setup(t, {
    modified: async () => { order.push("modificadas"); return { synchronized: 1 }; },
    published: async () => { order.push("publicadas"); return { synchronized: 1 }; },
  });
  startDailySync();
  await calls.jobs[0];
  assert.deepEqual(order, ["modificadas", "publicadas"]);
});

test("el cron diario puede volver a ejecutar el mismo proceso", async (t) => {
  const { startDailySync, calls } = setup(t);
  startDailySync();
  await calls.jobs[0];
  await calls.scheduled[0].callback();
  assert.equal(calls.jobs.length, 2);
  assert.equal(calls.published.length, 2);
});

test("omite cron solapado cuando una sincronización sigue activa", async (t) => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const { startDailySync, calls } = setup(t, {
    modified: () => pending,
  });
  startDailySync();
  assert.equal(calls.jobs.length, 1);
  await calls.scheduled[0].callback();
  assert.equal(calls.jobs.length, 1);
  assert.ok(calls.logs.some((args) => args.join(" ").includes("Sincronización omitida")));
  release({ synchronized: 0 });
  await calls.jobs[0];
});

test("un fallo de NIST detiene el proceso, registra el error y no publica el rango", async (t) => {
  const { startDailySync, calls } = setup(t, {
    modified: async () => { throw new Error("NIST no disponible"); },
  });
  startDailySync();
  await calls.jobs[0];
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.published.length, 0);
  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0][1].message, /NIST no disponible/);
});

test("un error de fechas almacenadas se informa sin bloquear futuros arranques", async (t) => {
  const { startDailySync, calls } = setup(t, {
    ranges: [{ end_date: new Date() }],
  });
  startDailySync();
  await calls.jobs[0];
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.modified.length, 0);
  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0][1].message, /cadenas YYYY-MM-DD/);
  await calls.scheduled[0].callback();
  assert.equal(calls.jobs.length, 2);
});
