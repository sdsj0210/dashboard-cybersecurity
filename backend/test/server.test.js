const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const target = require.resolve("../server");

function loadServer(t, { dbFails = false, port } = {}) {
  const originalPort = process.env.PORT;
  if (port === undefined) delete process.env.PORT;
  else process.env.PORT = String(port);
  t.after(() => {
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;
  });
  const calls = { env: 0, query: [], sync: 0, listen: [], log: [], error: [] };
  const mocks = {
    dotenv: { config() { calls.env++; } },
    "./src/config/database": {
      async query(sql) {
        calls.query.push(sql);
        if (dbFails) throw new Error("MySQL inaccesible");
        return [[{ ok: 1 }]];
      },
    },
    "./src/jobs/dailySync": { startDailySync() { calls.sync++; } },
    "./src/app": {
      listen(actualPort, callback) {
        calls.listen.push(actualPort);
        callback();
      },
    },
  };
  t.mock.method(console, "log", (...args) => calls.log.push(args));
  t.mock.method(console, "error", (...args) => calls.error.push(args));

  const original = Module._load;
  delete require.cache[target];
  try {
    Module._load = function (request, parent, isMain) {
      if (parent?.filename === target && Object.hasOwn(mocks, request)) {
        return mocks[request];
      }
      return original.apply(this, arguments);
    };
    require(target);
  } finally {
    Module._load = original;
    delete require.cache[target];
  }
  return calls;
}

const flush = async () => new Promise((resolve) => setImmediate(resolve));

test("comprueba MySQL antes de iniciar cron y el servidor", async (t) => {
  const calls = loadServer(t, { port: 3456 });
  await flush();
  assert.equal(calls.env, 1);
  assert.deepEqual(calls.query, ["SELECT 1"]);
  assert.equal(calls.sync, 1);
  assert.deepEqual(calls.listen, ["3456"]);
  assert.equal(calls.error.length, 0);
  assert.ok(calls.log.some((args) => args.join(" ").includes("Conexión a MySQL correcta")));
});

test("usa el puerto 3000 si PORT no está configurado", async (t) => {
  const calls = loadServer(t);
  await flush();
  assert.deepEqual(calls.listen, [3000]);
});

test("si MySQL falla, no inicia cron ni abre el servidor", async (t) => {
  const calls = loadServer(t, { dbFails: true });
  await flush();
  assert.deepEqual(calls.query, ["SELECT 1"]);
  assert.equal(calls.sync, 0);
  assert.deepEqual(calls.listen, []);
  assert.equal(calls.error.length, 1);
  assert.match(calls.error[0][1].message, /MySQL inaccesible/);
});
