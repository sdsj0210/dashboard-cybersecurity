const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const target = require.resolve("../src/routes/cveRoutes");

function loadRoutes(t, mode) {
  const before = process.env.NODE_ENV;
  if (mode === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = mode;
  t.after(() => {
    if (before === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = before;
  });

  const records = [];
  const router = {
    get(path, handler) { records.push({ method: "GET", path, handler }); },
    post(path, handler) { records.push({ method: "POST", path, handler }); },
  };
  const express = { Router: () => router };
  const controller = {
    getCves() {},
    getCveById() {},
    syncCves() {},
  };
  const original = Module._load;
  delete require.cache[target];
  let loaded;
  try {
    Module._load = function (request, parent, isMain) {
      if (parent?.filename === target && request === "express") return express;
      if (parent?.filename === target && request === "../controllers/cveController") {
        return controller;
      }
      return original.apply(this, arguments);
    };
    loaded = require(target);
  } finally {
    Module._load = original;
    delete require.cache[target];
  }
  return { router, loaded, records, controller };
}

test("registra las dos rutas de consulta con sus controladores", (t) => {
  const { router, loaded, records, controller } = loadRoutes(t, "development");
  assert.equal(loaded, router);
  assert.deepEqual(records.filter((r) => r.method === "GET"), [
    { method: "GET", path: "/", handler: controller.getCves },
    { method: "GET", path: "/:cveId", handler: controller.getCveById },
  ]);
});

test("habilita POST /sync en desarrollo", (t) => {
  const { records, controller } = loadRoutes(t, "development");
  assert.deepEqual(records.filter((r) => r.method === "POST"), [
    { method: "POST", path: "/sync", handler: controller.syncCves },
  ]);
});

test("deshabilita POST /sync en producción", (t) => {
  const { records } = loadRoutes(t, "production");
  assert.equal(records.some((r) => r.method === "POST"), false);
  assert.equal(records.filter((r) => r.method === "GET").length, 2);
});

test("sin NODE_ENV explícito, permite sincronización de desarrollo", (t) => {
  const { records } = loadRoutes(t, undefined);
  assert.equal(records.some((r) => r.method === "POST" && r.path === "/sync"), true);
});
