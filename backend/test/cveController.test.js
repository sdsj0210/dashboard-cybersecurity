const test = require("node:test");
const assert = require("node:assert/strict");

const cveService = require("../src/services/cveService");
const cveController = require("../src/controllers/cveController");

const {
  runExclusiveSync,
  isSyncInProgress,
} = require("../src/services/syncCoordinator");

// Simula los objetos req y res de Express.
const invoke = async (handler, { query = {}, params = {} } = {}) => {
  const res = {
    statusCode: 200,
    body: undefined,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };

  await handler({ query, params }, res);

  return res;
};

const validRange = {
  from: "2026-10-01",
  to: "2026-10-06",
};

// GET /api/cves

test("getCves envía filtros y paginación al servicio", async (t) => {
  const expected = {
    data: [{ cve_id: "CVE-2026-0001" }],
    pagination: {
      page: 2,
      limit: 5,
      total: 1,
      totalPages: 1,
    },
  };

  const service = t.mock.method(
    cveService,
    "getCves",
    async (filters, pagination) => {
      assert.deepEqual(filters, {
        severity: "HIGH",
        product: "linux",
        from: "2026-10-01",
        to: "2026-10-06",
        cveId: "CVE-2026-0001",
      });

      assert.deepEqual(pagination, {
        page: "2",
        limit: "5",
      });

      return expected;
    },
  );

  const res = await invoke(cveController.getCves, {
    query: {
      severity: "HIGH",
      product: "linux",
      ...validRange,
      cveId: "CVE-2026-0001",
      page: "2",
      limit: "5",
    },
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, expected);
  assert.equal(service.mock.calls.length, 1);
});

test("getCves rechaza una fecha inicial inexistente", async (t) => {
  const service = t.mock.method(cveService, "getCves", async () => {});

  const res = await invoke(cveController.getCves, {
    query: { from: "2026-02-30" },
  });

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /fechas deben tener formato/);
  assert.equal(service.mock.calls.length, 0);
});

test("getCves rechaza una fecha final con formato incorrecto", async (t) => {
  const service = t.mock.method(cveService, "getCves", async () => {});

  const res = await invoke(cveController.getCves, {
    query: { to: "06/10/2026" },
  });

  assert.equal(res.statusCode, 400);
  assert.equal(service.mock.calls.length, 0);
});

test("getCves rechaza fechas invertidas", async () => {
  const res = await invoke(cveController.getCves, {
    query: {
      from: "2026-10-10",
      to: "2026-10-01",
    },
  });

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /fecha inicial/);
});

test("getCves devuelve 500 cuando falla el servicio", async (t) => {
  t.mock.method(console, "error", () => {});

  t.mock.method(cveService, "getCves", async () => {
    throw new Error("MySQL no disponible");
  });

  const res = await invoke(cveController.getCves);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    message: "Error al obtener los CVEs",
  });
});

// GET /api/cves/:cveId

test("getCveById devuelve una vulnerabilidad existente", async (t) => {
  const cve = {
    cve_id: "CVE-2026-0001",
    metrics: [],
    products: [],
  };

  const service = t.mock.method(cveService, "getCveById", async (id) => {
    assert.equal(id, "CVE-2026-0001");
    return cve;
  });

  const res = await invoke(cveController.getCveById, {
    params: { cveId: "CVE-2026-0001" },
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, cve);
  assert.equal(service.mock.calls.length, 1);
});

test("getCveById devuelve 404 si la CVE no existe", async (t) => {
  t.mock.method(cveService, "getCveById", async () => null);

  const res = await invoke(cveController.getCveById, {
    params: { cveId: "CVE-2026-9999" },
  });

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, {
    message: "CVE no encontrada",
  });
});

test("getCveById devuelve 500 cuando ocurre un error", async (t) => {
  t.mock.method(console, "error", () => {});

  t.mock.method(cveService, "getCveById", async () => {
    throw new Error("Fallo de lectura");
  });

  const res = await invoke(cveController.getCveById, {
    params: { cveId: "CVE-2026-0001" },
  });

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    message: "Error al obtener la CVE",
  });
});

// POST /api/cves/sync

test("syncCves exige ambas fechas", async (t) => {
  const service = t.mock.method(cveService, "syncCves", async () => {});

  const queries = [{}, { from: "2026-10-01" }, { to: "2026-10-06" }];

  for (const query of queries) {
    const res = await invoke(cveController.syncCves, {
      query,
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /indicar las fechas/);
  }

  assert.equal(service.mock.calls.length, 0);
});

test("syncCves rechaza fechas inválidas", async (t) => {
  const service = t.mock.method(cveService, "syncCves", async () => {});

  const queries = [
    {
      from: "2026-02-30",
      to: "2026-03-01",
    },
    {
      from: "2026-10-01",
      to: "2026-13-01",
    },
  ];

  for (const query of queries) {
    const res = await invoke(cveController.syncCves, {
      query,
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /formato YYYY-MM-DD/);
  }

  assert.equal(service.mock.calls.length, 0);
});

test("syncCves rechaza un rango invertido", async () => {
  const res = await invoke(cveController.syncCves, {
    query: {
      from: "2026-10-06",
      to: "2026-10-01",
    },
  });

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /fecha inicial/);
});

test("syncCves rechaza rangos mayores de 120 días", async (t) => {
  const service = t.mock.method(cveService, "syncCves", async () => {});

  const res = await invoke(cveController.syncCves, {
    query: {
      from: "2026-01-01",
      to: "2026-05-02",
    },
  });

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /120 días/);
  assert.equal(service.mock.calls.length, 0);
});

test("syncCves admite exactamente 120 días y devuelve éxito", async (t) => {
  const expectedRanges = [
    {
      from: "2026-01-01",
      to: "2026-05-01",
    },
  ];

  const service = t.mock.method(cveService, "syncCves", async (from, to) => {
    assert.equal(from, "2026-01-01");
    assert.equal(to, "2026-05-01");

    return {
      requestedNist: true,
      synchronized: 20,
      totalResults: 20,
      from,
      to,
      synchronizedRanges: expectedRanges,
    };
  });

  const res = await invoke(cveController.syncCves, {
    query: {
      from: "2026-01-01",
      to: "2026-05-01",
    },
  });

  assert.equal(res.statusCode, 200);

  assert.deepEqual(res.body, {
    message: "Sincronización completada correctamente",
    synchronized: 20,
    totalResults: 20,
    from: "2026-01-01",
    to: "2026-05-01",
    synchronizedRanges: expectedRanges,
  });

  assert.equal(service.mock.calls.length, 1);
});

test("syncCves informa si el periodo ya estaba sincronizado", async (t) => {
  t.mock.method(cveService, "syncCves", async (from, to) => ({
    requestedNist: false,
    synchronized: 0,
    totalResults: 0,
    from,
    to,
    synchronizedRanges: [],
  }));

  const res = await invoke(cveController.syncCves, {
    query: validRange,
  });

  assert.equal(res.statusCode, 200);

  assert.equal(
    res.body.message,
    "El periodo solicitado ya estaba sincronizado",
  );

  assert.equal(res.body.synchronized, 0);
});

test("syncCves devuelve 409 cuando otra sincronización está activa", async (t) => {
  const service = t.mock.method(cveService, "syncCves", async () => {
    throw new Error("No debería iniciarse otra sincronización");
  });

  let release;

  const pending = new Promise((resolve) => {
    release = resolve;
  });

  const active = runExclusiveSync(() => pending);

  try {
    assert.equal(isSyncInProgress(), true);

    const res = await invoke(cveController.syncCves, {
      query: validRange,
    });

    assert.equal(res.statusCode, 409);

    assert.deepEqual(res.body, {
      message: "Ya hay una sincronización en curso",
    });

    assert.equal(service.mock.calls.length, 0);
  } finally {
    release();
    await active;
  }

  assert.equal(isSyncInProgress(), false);
});

test("syncCves devuelve 500 ante un error inesperado", async (t) => {
  t.mock.method(console, "error", () => {});

  t.mock.method(cveService, "syncCves", async () => {
    throw new Error("NIST no disponible");
  });

  const res = await invoke(cveController.syncCves, {
    query: validRange,
  });

  assert.equal(res.statusCode, 500);

  assert.deepEqual(res.body, {
    message: "Error al sincronizar los CVEs",
  });

  assert.equal(isSyncInProgress(), false);
});
