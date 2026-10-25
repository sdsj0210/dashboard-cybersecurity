const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const target = require.resolve("../src/config/database");

test("configura MySQL con variables de entorno y conserva las fechas DATE como texto", (t) => {
  const values = {
    DB_HOST: "127.0.0.1",
    DB_USER: "usuario_prueba",
    DB_PASSWORD: "clave_ficticia",
    DB_NAME: "bd_prueba",
    DB_PORT: "3307",
  };
  const saved = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const fakePool = { fake: true };
  let received;
  const original = Module._load;
  delete require.cache[target];
  let loaded;
  try {
    Module._load = function (request, parent, isMain) {
      if (parent?.filename === target && request === "mysql2/promise") {
        return { createPool(options) { received = options; return fakePool; } };
      }
      return original.apply(this, arguments);
    };
    loaded = require(target);
  } finally {
    Module._load = original;
    delete require.cache[target];
  }

  assert.equal(loaded, fakePool);
  assert.deepEqual(received, {
    host: "127.0.0.1",
    user: "usuario_prueba",
    password: "clave_ficticia",
    database: "bd_prueba",
    port: "3307",
    dateStrings: ["DATE"],
  });
});

test("utiliza el puerto 3306 por defecto", (t) => {
  const previous = process.env.DB_PORT;
  delete process.env.DB_PORT;
  t.after(() => {
    if (previous === undefined) delete process.env.DB_PORT;
    else process.env.DB_PORT = previous;
  });

  const original = Module._load;
  delete require.cache[target];
  let received;
  try {
    Module._load = function (request, parent, isMain) {
      if (parent?.filename === target && request === "mysql2/promise") {
        return { createPool(options) { received = options; return {}; } };
      }
      return original.apply(this, arguments);
    };
    require(target);
  } finally {
    Module._load = original;
    delete require.cache[target];
  }
  assert.equal(received.port, 3306);
  assert.deepEqual(received.dateStrings, ["DATE"]);
});
