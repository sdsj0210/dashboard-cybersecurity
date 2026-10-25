const test = require("node:test");
const assert = require("node:assert/strict");

const db = require("../src/config/database");
const cveRepository = require("../src/repositories/cveRepository");
const { clear } = require("node:console");

const compactSql = (sql) => sql.replace(/\s+/g, " ").trim();

const sampleCve = () => ({
  cve: {
    cveId: "CVE-2026-1234",
    sourceIdentifier: "security@example.org",
    descriptionEn: "Example vulnerability",
    descriptionEs: null,
    publishedAt: "2026-10-01T10:00:00.000",
    lastModifiedAt: "2026-10-02T11:00:00.000",
    status: "Analyzed",
  },
  metrics: [
    {
      version: "3.1",
      score: 9.8,
      severity: "CRITICAL",
      vector: "CVSS:3.1/AV:N",
      source: "NVD",
      type: "Primary",
      exploitabilityScore: 3.9,
      impactScore: 5.9,
    },
  ],
  products: [
    {
      vendor: "example",
      product: "demo",
      packageName: null,
      collectionUrl: null,
      defaultStatus: "unaffected",
      versions: [
        {
          version: "1.0",
          lessThan: "2.0",
          lessThanOrEqual: null,
          versionType: "semver",
          status: "affected",
        },
      ],
    },
  ],
  weaknesses: [
    {
      weaknessCode: "CWE-79",
      source: "NVD",
      type: "Primary",
    },
  ],
  references: [
    {
      url: "https://example.org/advisory",
      source: "NVD",
      tags: ["Vendor Advisory"],
    },
  ],
});

// Conexión simulada para comprobar transacciones sin usar MySQL.
const fakeConnection = ({ failSql, failCommit = false } = {}) => {
  const calls = [];

  const connection = {
    async beginTransaction() {
      calls.push({ type: "begin" });
    },

    async query(sql, params = []) {
      const statement = compactSql(sql);

      calls.push({
        type: "query",
        sql: statement,
        params,
      });

      if (failSql && statement.includes(failSql)) {
        throw new Error("Fallo SQL simulado");
      }

      if (statement.startsWith("SELECT id FROM cves")) {
        return [[{ id: 7 }]];
      }

      if (statement.startsWith("INSERT INTO cve_products")) {
        return [{ insertId: 14 }];
      }

      return [{ affectedRows: 1 }];
    },

    async commit() {
      calls.push({ type: "commit" });

      if (failCommit) {
        throw new Error("Fallo de commit");
      }
    },

    async rollback() {
      calls.push({ type: "rollback" });
    },

    release() {
      calls.push({ type: "release" });
    },
  };

  return { connection, calls };
};

// CONSULTAS Y FILTROS

test("getAllCves consulta listado y total sin filtros", async (t) => {
  const calls = [];

  t.mock.method(db, "query", async (sql, params) => {
    calls.push({
      sql: compactSql(sql),
      params,
    });

    return calls.length === 1
      ? [[{ cve_id: "CVE-2026-1234", score: "9.8" }]]
      : [[{ total: 23 }]];
  });

  const result = await cveRepository.getAllCves();

  assert.equal(result.total, 23);
  assert.equal(result.rows[0].cve_id, "CVE-2026-1234");

  assert.match(calls[0].sql, /SELECT DISTINCT/);
  assert.match(calls[0].sql, /ORDER BY c\.published_at DESC/);
  assert.match(calls[1].sql, /COUNT\(DISTINCT c\.id\)/);

  assert.deepEqual(calls[0].params, [20, 0]);
  assert.deepEqual(calls[1].params, []);
});

test("getAllCves aplica todos los filtros con parámetros SQL", async (t) => {
  const calls = [];

  t.mock.method(db, "query", async (sql, params) => {
    calls.push({
      sql: compactSql(sql),
      params,
    });

    return calls.length === 1 ? [[]] : [[{ total: 0 }]];
  });

  await cveRepository.getAllCves(
    {
      severity: "HIGH",
      product: "linux",
      from: "2026-10-01",
      to: "2026-10-24",
      cveId: "CVE-2026-1234",
    },
    {
      limit: 5,
      offset: 10,
    },
  );

  assert.match(calls[0].sql, /m\.severity = \?/);
  assert.match(calls[0].sql, /EXISTS \( SELECT 1 FROM cve_products cp/);
  assert.match(calls[0].sql, /cp\.product LIKE \?/);
  assert.match(calls[0].sql, /c\.published_at >= \?/);
  assert.match(
    calls[0].sql,
    /c\.published_at < DATE_ADD\(\?, INTERVAL 1 DAY\)/,
  );
  assert.match(calls[0].sql, /c\.cve_id = \?/);

  const expectedFilters = [
    "HIGH",
    "%linux%",
    "2026-10-01",
    "2026-10-24",
    "CVE-2026-1234",
  ];

  assert.deepEqual(calls[0].params, [...expectedFilters, 5, 10]);

  assert.deepEqual(calls[1].params, expectedFilters);
});

test("getAllCves propaga un error en la consulta del total", async (t) => {
  let count = 0;

  t.mock.method(db, "query", async () => {
    count++;

    if (count === 2) {
      throw new Error("Error MySQL");
    }

    return [[]];
  });

  await assert.rejects(cveRepository.getAllCves(), /Error MySQL/);
});

// DETALLE DE VULNERABILIDADES

test("getCveById devuelve null cuando no existe", async (t) => {
  const query = t.mock.method(db, "query", async () => [[]]);

  const result = await cveRepository.getCveById("CVE-UNKNOWN");

  assert.equal(result, null);
  assert.equal(query.mock.calls.length, 1);

  assert.deepEqual(query.mock.calls[0].arguments[1], ["CVE-UNKNOWN"]);
});

test("getCveById recupera métricas, productos, versiones, debilidades y referencias", async (t) => {
  const responses = [
    [[{ id: 7, cve_id: "CVE-2026-1234" }]],
    [[{ version: "3.1", score: "9.8" }]],
    [
      [
        { id: 11, product: "demo" },
        { id: 12, product: "other" },
      ],
    ],
    [[{ version: "1.0", status: "affected" }]],
    [[{ version: "2.0", status: "affected" }]],
    [[{ weakness_code: "CWE-79" }]],
    [[{ url: "https://example.org" }]],
  ];

  const calls = [];

  t.mock.method(db, "query", async (sql, params) => {
    calls.push({
      sql: compactSql(sql),
      params,
    });

    return responses[calls.length - 1];
  });

  const result = await cveRepository.getCveById("CVE-2026-1234");

  assert.equal(result.cve_id, "CVE-2026-1234");
  assert.equal(result.metrics.length, 1);
  assert.equal(result.products.length, 2);

  assert.deepEqual(result.products[0].versions, [
    { version: "1.0", status: "affected" },
  ]);

  assert.deepEqual(result.products[1].versions, [
    { version: "2.0", status: "affected" },
  ]);

  assert.deepEqual(result.weaknesses, [{ weakness_code: "CWE-79" }]);

  assert.deepEqual(result.references, [{ url: "https://example.org" }]);

  assert.deepEqual(calls[3].params, [11]);
  assert.deepEqual(calls[4].params, [12]);
  assert.equal(calls.length, 7);
});

test("getCveById sin productos no consulta versiones", async (t) => {
  const responses = [[[{ id: 7, cve_id: "CVE-TEST" }]], [[]], [[]], [[]], [[]]];

  const calls = [];

  t.mock.method(db, "query", async (sql) => {
    calls.push(compactSql(sql));

    return responses[calls.length - 1];
  });

  const result = await cveRepository.getCveById("CVE-TEST");

  assert.deepEqual(result.products, []);
  assert.equal(calls.length, 5);

  assert.equal(
    calls.some((sql) => sql.includes("FROM cve_product_versions")),
    false,
  );
});

test("getCveById propaga errores al consultar datos relacionados", async (t) => {
  let count = 0;

  t.mock.method(db, "query", async () => {
    count++;

    if (count === 1) {
      return [[{ id: 7, cve_id: "CVE-TEST" }]];
    }

    throw new Error("Error leyendo métricas");
  });

  await assert.rejects(
    cveRepository.getCveById("CVE-TEST"),
    /Error leyendo métricas/,
  );
});

// PERIODOS DE SINCRONIZACIÓN

test("getSyncRanges obtiene los periodos ordenados", async (t) => {
  const dates = [
    {
      start_date: "2026-10-01",
      end_date: "2026-10-07",
    },
  ];

  t.mock.method(db, "query", async (sql) => {
    assert.match(compactSql(sql), /FROM sync_ranges ORDER BY start_date ASC/);

    return [dates];
  });

  const result = await cveRepository.getSyncRanges();

  assert.deepEqual(result, dates);
});

test("saveSyncRange inserta las dos fechas como parámetros", async (t) => {
  const query = t.mock.method(db, "query", async () => [{ insertId: 8 }]);

  await cveRepository.saveSyncRange("2026-10-01", "2026-10-24");

  assert.match(
    compactSql(query.mock.calls[0].arguments[0]),
    /INSERT INTO sync_ranges/,
  );

  assert.deepEqual(query.mock.calls[0].arguments[1], [
    "2026-10-01",
    "2026-10-24",
  ]);
});

test("saveSyncRange propaga errores de MySQL", async (t) => {
  t.mock.method(db, "query", async () => {
    throw new Error("Fallo insertando rango");
  });

  await assert.rejects(
    cveRepository.saveSyncRange("2026-10-01", "2026-10-24"),
    /Fallo insertando rango/,
  );
});

// TRANSACCIONES Y GUARDADO DE CVEs

test("saveCve guarda todos los datos dentro de una transacción", async (t) => {
  const { connection, calls } = fakeConnection();

  t.mock.method(db, "getConnection", async () => connection);

  await cveRepository.saveCve(sampleCve());

  assert.equal(calls[0].type, "begin");

  assert.deepEqual(
    calls.slice(-2).map((call) => call.type),
    ["commit", "release"],
  );

  assert.equal(
    calls.some((call) => call.type === "rollback"),
    false,
  );

  const queries = calls.filter((call) => call.type === "query");

  const insert = (table) =>
    queries.find((call) => call.sql.startsWith(`INSERT INTO ${table}`));

  assert.match(insert("cves").sql, /ON DUPLICATE KEY UPDATE/);

  assert.equal(insert("cves").params[0], "CVE-2026-1234");

  assert.deepEqual(
    queries
      .filter((call) => call.sql.startsWith("DELETE FROM"))
      .map((call) => call.params),
    [[7], [7], [7], [7]],
  );

  assert.equal(insert("cve_metrics").params[0], 7);
  assert.equal(insert("cve_products").params[0], 7);
  assert.equal(insert("cve_product_versions").params[0], 14);
  assert.equal(insert("cve_weaknesses").params[0], 7);
  assert.equal(insert("cve_references").params[0], 7);

  assert.equal(insert("cve_references").params[3], '["Vendor Advisory"]');
});

test("saveCve admite CVEs sin métricas ni relaciones", async (t) => {
  const { connection, calls } = fakeConnection();

  t.mock.method(db, "getConnection", async () => connection);

  await cveRepository.saveCve({
    ...sampleCve(),
    metrics: [],
    products: [],
    weaknesses: [],
    references: [],
  });

  const queries = calls.filter((call) => call.type === "query");

  assert.equal(
    queries.filter((call) => call.sql.startsWith("INSERT INTO")).length,
    1,
  );

  assert.equal(
    queries.filter((call) => call.sql.startsWith("DELETE FROM")).length,
    4,
  );

  assert.deepEqual(
    calls.slice(-2).map((call) => call.type),
    ["commit", "release"],
  );
});

test("saveCve hace rollback y libera la conexión cuando falla el INSERT principal", async (t) => {
  const { connection, calls } = fakeConnection({
    failSql: "INSERT INTO cves",
  });

  t.mock.method(db, "getConnection", async () => connection);

  await assert.rejects(
    cveRepository.saveCve(sampleCve()),
    /Fallo SQL simulado/,
  );

  assert.deepEqual(
    calls.slice(-2).map((call) => call.type),
    ["rollback", "release"],
  );

  assert.equal(
    calls.some((call) => call.type === "commit"),
    false,
  );
});

test("saveCve hace rollback si falla un registro relacionado", async (t) => {
  const { connection, calls } = fakeConnection({
    failSql: "INSERT INTO cve_product_versions",
  });

  t.mock.method(db, "getConnection", async () => connection);

  await assert.rejects(
    cveRepository.saveCve(sampleCve()),
    /Fallo SQL simulado/,
  );

  assert.deepEqual(
    calls.slice(-2).map((call) => call.type),
    ["rollback", "release"],
  );

  assert.equal(
    calls.some((call) => call.type === "commit"),
    false,
  );
});

test("saveCve revierte la transacción si falla commit", async (t) => {
  const { connection, calls } = fakeConnection({
    failCommit: true,
  });

  t.mock.method(db, "getConnection", async () => connection);

  await assert.rejects(cveRepository.saveCve(sampleCve()), /Fallo de commit/);

  assert.deepEqual(
    calls.slice(-3).map((call) => call.type),
    ["commit", "rollback", "release"],
  );
});

test("saveCve propaga un fallo al obtener conexión", async (t) => {
  t.mock.method(db, "getConnection", async () => {
    throw new Error("Sin conexión");
  });

  await assert.rejects(cveRepository.saveCve(sampleCve()), /Sin conexión/);
});
