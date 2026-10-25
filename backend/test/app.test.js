const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const target = require.resolve("../src/app");

function loadWithMocks(mocks) {
  const original = Module._load;
  delete require.cache[target];
  try {
    Module._load = function (request, parent, isMain) {
      if (parent?.filename === target && Object.hasOwn(mocks, request)) {
        return mocks[request];
      }
      return original.apply(this, arguments);
    };
    return require(target);
  } finally {
    Module._load = original;
    delete require.cache[target];
  }
}

function createHarness(t) {
  const originalOrigin = process.env.FRONTEND_URL;
  process.env.FRONTEND_URL = "http://localhost:5173";
  t.after(() => {
    if (originalOrigin === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalOrigin;
  });

  const calls = { middlewares: [], routes: [], options: {} };
  const app = {
    use(...args) { calls.middlewares.push(args); },
    get(path, handler) { calls.routes.push({ path, handler }); },
  };
  const express = () => app;
  express.json = (options) => {
    calls.options.json = options;
    return "json-middleware";
  };
  const cors = (options) => {
    calls.options.cors = options;
    return "cors-middleware";
  };
  const helmet = () => "helmet-middleware";
  const rateLimit = (options) => {
    calls.options.rateLimit = options;
    return "limiter-middleware";
  };
  const routes = { routes: "cves" };

  const loaded = loadWithMocks({
    express,
    cors,
    helmet,
    "express-rate-limit": { rateLimit },
    "./routes/cveRoutes": routes,
  });

  return { loaded, app, calls, routes };
}

test("exporta la aplicación Express configurada", (t) => {
  const { loaded, app } = createHarness(t);
  assert.equal(loaded, app);
});

test("Helmet, CORS, limitador y JSON respetan el orden previsto", (t) => {
  const { calls, routes } = createHarness(t);
  assert.deepEqual(calls.middlewares, [
    ["helmet-middleware"],
    ["cors-middleware"],
    ["json-middleware"],
    ["/api/cves", "limiter-middleware", routes],
  ]);
});

test("CORS permite solamente el frontend configurado y métodos previstos", (t) => {
  const { calls } = createHarness(t);
  assert.deepEqual(calls.options.cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Cache-Control"],
    credentials: true,
  });
});

test("limita las solicitudes a 100 por cada quince minutos", (t) => {
  const { calls } = createHarness(t);
  assert.equal(calls.options.rateLimit.windowMs, 15 * 60 * 1000);
  assert.equal(calls.options.rateLimit.limit, 100);
  assert.equal(calls.options.rateLimit.standardHeaders, "draft-8");
  assert.equal(calls.options.rateLimit.legacyHeaders, false);
  assert.match(calls.options.rateLimit.message.message, /Demasiadas solicitudes/);
});

test("limita el tamaño de solicitudes JSON a 10kb", (t) => {
  const { calls } = createHarness(t);
  assert.deepEqual(calls.options.json, { limit: "10kb" });
});

test("GET / devuelve el mensaje de estado del servidor", (t) => {
  const { calls } = createHarness(t);
  const root = calls.routes.find((route) => route.path === "/");
  assert.ok(root);
  let body;
  root.handler({}, { json(value) { body = value; } });
  assert.deepEqual(body, { message: "CVE Dashboard API funcionando" });
});
