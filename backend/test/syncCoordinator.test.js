const test = require("node:test");
const assert = require("node:assert/strict");

const {
  runExclusiveSync,
  isSyncInProgress,
  SyncInProgressError,
} = require("../src/services/syncCoordinator");

test("no hay sincronización activa inicialmente", () => {
  assert.equal(isSyncInProgress(), false);
});

test("ejecuta una tarea y devuelve su resultado", async () => {
  const result = await runExclusiveSync(async () => "completado");

  assert.equal(result, "completado");
  assert.equal(isSyncInProgress(), false);
});

test("mantiene el bloqueo mientras la tarea está pendiente", async () => {
  let finish;

  const pending = new Promise((resolve) => {
    finish = resolve;
  });

  const running = runExclusiveSync(() => pending);

  assert.equal(isSyncInProgress(), true);

  finish(42);

  assert.equal(await running, 42);
  assert.equal(isSyncInProgress(), false);
});

test("rechaza una segunda sincronización con un error 409", async () => {
  let finish;

  const pending = new Promise((resolve) => {
    finish = resolve;
  });

  const running = runExclusiveSync(() => pending);

  try {
    await assert.rejects(
      runExclusiveSync(async () => "duplicada"),
      (error) => {
        assert.ok(error instanceof SyncInProgressError);
        assert.equal(error.name, "SyncInProgressError");
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /sincronización en curso/);

        return true;
      },
    );

    assert.equal(isSyncInProgress(), true);
  } finally {
    finish("primera");
    await running;
  }

  assert.equal(isSyncInProgress(), false);
});

test("libera el bloqueo incluso cuando una tarea falla", async () => {
  await assert.rejects(
    runExclusiveSync(async () => {
      throw new Error("fallo simulado");
    }),
    /fallo simulado/,
  );

  assert.equal(isSyncInProgress(), false);

  assert.equal(await runExclusiveSync(async () => "recuperado"), "recuperado");
});

test("permite sincronizaciones sucesivas", async () => {
  const calls = [];

  await runExclusiveSync(async () => calls.push("primera"));
  await runExclusiveSync(async () => calls.push("segunda"));

  assert.deepEqual(calls, ["primera", "segunda"]);
  assert.equal(isSyncInProgress(), false);
});
