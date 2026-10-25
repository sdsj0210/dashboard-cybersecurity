const test = require("node:test");
const assert = require("node:assert/strict");

const { getCves, getModifiedCves } = require("../src/services/nistService");

const response = (data, status = 200, message = null) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (header) => (header === "message" ? message : null),
  },
  json: async () => data,
});

// Simula el paso del tiempo para probar reintentos
// sin esperar realmente 5, 10, 15 o 30 segundos.
const fastRetries = (t, { triggerTimeout = false } = {}) => {
  const delays = [];

  t.mock.method(globalThis, "setTimeout", (callback, delay) => {
    if (delay === 30000) {
      if (triggerTimeout) {
        queueMicrotask(callback);
      }
    } else {
      delays.push(delay);
      queueMicrotask(callback);
    }

    return 1;
  });

  t.mock.method(globalThis, "clearTimeout", () => {});
  t.mock.method(console, "warn", () => {});

  return delays;
};

test("consulta CVEs publicadas con los parámetros correctos", async (t) => {
  const originalApiKey = process.env.NVD_API_KEY;

  process.env.NVD_API_KEY = "clave-de-prueba";

  t.after(() => {
    if (originalApiKey === undefined) {
      delete process.env.NVD_API_KEY;
    } else {
      process.env.NVD_API_KEY = originalApiKey;
    }
  });

  let requestedUrl;
  let options;

  t.mock.method(globalThis, "fetch", async (url, config) => {
    requestedUrl = new URL(url);
    options = config;

    return response({
      vulnerabilities: [{ cve: { id: "CVE-TEST-0001" } }],
      totalResults: 1,
    });
  });

  const result = await getCves("2026-10-01", "2026-10-02");

  assert.equal(requestedUrl.origin, "https://services.nvd.nist.gov");

  assert.equal(requestedUrl.pathname, "/rest/json/cves/2.0");

  assert.equal(
    requestedUrl.searchParams.get("pubStartDate"),
    "2026-10-01T00:00:00.000",
  );

  assert.equal(
    requestedUrl.searchParams.get("pubEndDate"),
    "2026-10-02T23:59:59.999",
  );

  assert.equal(requestedUrl.searchParams.get("resultsPerPage"), "2000");

  assert.equal(requestedUrl.searchParams.get("startIndex"), "0");

  assert.equal(requestedUrl.searchParams.has("noRejected"), true);

  assert.equal(options.headers.apiKey, "clave-de-prueba");
  assert.ok(options.signal instanceof AbortSignal);

  assert.equal(result.totalResults, 1);
  assert.equal(result.vulnerabilities[0].cve.id, "CVE-TEST-0001");
});

test("consulta CVEs modificadas con las fechas correctas", async (t) => {
  let searchParams;

  t.mock.method(globalThis, "fetch", async (url) => {
    searchParams = new URL(url).searchParams;

    return response({
      vulnerabilities: [],
      totalResults: 0,
    });
  });

  await getModifiedCves("2026-10-21", "2026-10-24");

  assert.equal(searchParams.get("lastModStartDate"), "2026-10-21T00:00:00.000");

  assert.equal(searchParams.get("lastModEndDate"), "2026-10-24T23:59:59.999");

  assert.equal(searchParams.has("pubStartDate"), false);
});

test("no envía apiKey cuando no está configurada", async (t) => {
  const originalApiKey = process.env.NVD_API_KEY;

  delete process.env.NVD_API_KEY;

  t.after(() => {
    if (originalApiKey === undefined) {
      delete process.env.NVD_API_KEY;
    } else {
      process.env.NVD_API_KEY = originalApiKey;
    }
  });

  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.deepEqual(options.headers, {});

    return response({
      vulnerabilities: [],
      totalResults: 0,
    });
  });

  await getCves("2026-10-01", "2026-10-01");
});

test("pagina correctamente más de 2000 CVEs", async (t) => {
  const offsets = [];

  const firstPage = Array.from({ length: 2000 }, (_, i) => ({
    cve: { id: `CVE-TEST-${i}` },
  }));

  t.mock.method(globalThis, "fetch", async (url) => {
    const offset = Number(new URL(url).searchParams.get("startIndex"));

    offsets.push(offset);

    return response({
      vulnerabilities:
        offset === 0 ? firstPage : [{ cve: { id: "CVE-TEST-2000" } }],
      totalResults: 2001,
    });
  });

  const result = await getCves("2026-10-01", "2026-10-01");

  assert.deepEqual(offsets, [0, 2000]);
  assert.equal(result.totalResults, 2001);
  assert.equal(result.vulnerabilities.length, 2001);
});

test("detiene la paginación cuando NIST devuelve una página vacía", async (t) => {
  let calls = 0;

  t.mock.method(globalThis, "fetch", async () => {
    calls++;

    return response({
      vulnerabilities: [],
      totalResults: 10,
    });
  });

  const result = await getCves("2026-10-01", "2026-10-01");

  assert.equal(calls, 1);
  assert.deepEqual(result.vulnerabilities, []);
});

test("rechaza HTTP 403 sin reintentar", async (t) => {
  let calls = 0;

  t.mock.method(globalThis, "fetch", async () => {
    calls++;

    return response(null, 403, "API key inválida");
  });

  await assert.rejects(
    getCves("2026-10-01", "2026-10-01"),
    /NIST respondió 403: API key inválida/,
  );

  assert.equal(calls, 1);
});

test("reintenta HTTP 500 y continúa cuando NIST responde", async (t) => {
  const delays = fastRetries(t);
  let calls = 0;

  t.mock.method(globalThis, "fetch", async () => {
    calls++;

    return calls === 1
      ? response(null, 500)
      : response({
          vulnerabilities: [],
          totalResults: 0,
        });
  });

  await getCves("2026-10-01", "2026-10-01");

  assert.equal(calls, 2);
  assert.deepEqual(delays, [5000]);
});

test("tras cuatro respuestas 429 devuelve error y aplica backoff", async (t) => {
  const delays = fastRetries(t);
  let calls = 0;

  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return response(null, 429);
  });

  await assert.rejects(
    getCves("2026-10-01", "2026-10-01"),
    /Se agotaron los 4 intentos/,
  );

  assert.equal(calls, 4);
  assert.deepEqual(delays, [5000, 10000, 15000]);
});

test("reintenta errores de red y se recupera", async (t) => {
  const delays = fastRetries(t);
  let calls = 0;

  t.mock.method(globalThis, "fetch", async () => {
    calls++;

    if (calls === 1) {
      throw new TypeError("network failed");
    }

    return response({
      vulnerabilities: [],
      totalResults: 0,
    });
  });

  await getCves("2026-10-01", "2026-10-01");

  assert.equal(calls, 2);
  assert.deepEqual(delays, [5000]);
});

test("reintenta una petición que supera el timeout", async (t) => {
  const delays = fastRetries(t, {
    triggerTimeout: true,
  });

  let calls = 0;

  t.mock.method(globalThis, "fetch", (_url, { signal }) => {
    calls++;

    if (calls > 1) {
      return Promise.resolve(
        response({
          vulnerabilities: [],
          totalResults: 0,
        }),
      );
    }

    return new Promise((_resolve, reject) => {
      signal.addEventListener(
        "abort",
        () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        },
        { once: true },
      );
    });
  });

  await getCves("2026-10-01", "2026-10-01");

  assert.equal(calls, 2);
  assert.deepEqual(delays, [5000]);
});
