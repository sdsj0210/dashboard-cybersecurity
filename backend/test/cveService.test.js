const test = require("node:test");
const assert = require("node:assert/strict");

const cveRepository = require("../src/repositories/cveRepository");
const nistService = require("../src/services/nistService");
const cveService = require("../src/services/cveService");

const emptyResponse = {
  vulnerabilities: [],
  totalResults: 0,
};

const vulnerability = (id, fields = {}) => ({
  cve: { id, ...fields },
});

const silenceLogs = (t) => {
  t.mock.method(console, "log", () => {});
};

// CONSULTAS Y PAGINACIÓN

test("getCves aplica filtros, paginación y convierte puntuaciones", async (t) => {
  const filters = {
    severity: "HIGH",
    product: "linux",
  };

  t.mock.method(cveRepository, "getAllCves", async (received, pagination) => {
    assert.deepEqual(received, filters);
    assert.deepEqual(pagination, {
      limit: 5,
      offset: 10,
    });

    return {
      rows: [
        { cve_id: "CVE-TEST-1", score: "8.2" },
        { cve_id: "CVE-TEST-2", score: null },
      ],
      total: 13,
    };
  });

  const result = await cveService.getCves(filters, {
    page: "3",
    limit: "5",
  });

  assert.deepEqual(
    result.data.map((cve) => cve.score),
    [8.2, null],
  );

  assert.deepEqual(result.pagination, {
    page: 3,
    limit: 5,
    total: 13,
    totalPages: 3,
  });
});

test("getCves utiliza paginación por defecto si los valores son inválidos", async (t) => {
  t.mock.method(cveRepository, "getAllCves", async (_, pagination) => {
    assert.deepEqual(pagination, {
      limit: 20,
      offset: 0,
    });

    return {
      rows: [],
      total: 0,
    };
  });

  const result = await cveService.getCves(
    {},
    { page: "incorrecta", limit: "0" },
  );

  assert.equal(result.pagination.page, 1);
  assert.equal(result.pagination.totalPages, 0);
});

test("getCves limita el tamaño de página a 100 registros", async (t) => {
  t.mock.method(cveRepository, "getAllCves", async (_, pagination) => {
    assert.deepEqual(pagination, {
      limit: 100,
      offset: 100,
    });

    return {
      rows: [],
      total: 300,
    };
  });

  const result = await cveService.getCves({}, { page: 2, limit: 9999 });

  assert.equal(result.pagination.limit, 100);
  assert.equal(result.pagination.totalPages, 3);
});

// DETALLE DE VULNERABILIDADES

test("getCveById devuelve null cuando la vulnerabilidad no existe", async (t) => {
  t.mock.method(cveRepository, "getCveById", async () => null);

  const result = await cveService.getCveById("CVE-INEXISTENTE");

  assert.equal(result, null);
});

test("getCveById convierte métricas numéricas y conserva valores nulos", async (t) => {
  t.mock.method(cveRepository, "getCveById", async () => ({
    cve_id: "CVE-TEST-1",
    metrics: [
      {
        score: "9.8",
        exploitability_score: "3.9",
        impact_score: "5.9",
      },
      {
        score: null,
        exploitability_score: null,
        impact_score: null,
      },
    ],
    products: [],
  }));

  const result = await cveService.getCveById("CVE-TEST-1");

  assert.deepEqual(result.metrics[0], {
    score: 9.8,
    exploitability_score: 3.9,
    impact_score: 5.9,
  });

  assert.deepEqual(result.metrics[1], {
    score: null,
    exploitability_score: null,
    impact_score: null,
  });
});

// SINCRONIZACIÓN Y RANGOS DE FECHAS

test("syncCves no consulta NIST cuando todo el periodo está sincronizado", async (t) => {
  t.mock.method(cveRepository, "getSyncRanges", async () => [
    {
      start_date: "2026-10-01",
      end_date: "2026-10-10",
    },
  ]);

  const nistMock = t.mock.method(nistService, "getCves", async () => {
    throw new Error("No debería llamarse a NIST");
  });

  const result = await cveService.syncCves("2026-10-03", "2026-10-08");

  assert.equal(result.requestedNist, false);
  assert.equal(result.synchronized, 0);
  assert.deepEqual(result.synchronizedRanges, []);
  assert.equal(nistMock.mock.calls.length, 0);
});

test("syncCves encuentra un día faltante entre dos periodos", async (t) => {
  silenceLogs(t);

  t.mock.method(cveRepository, "getSyncRanges", async () => [
    {
      start_date: "2026-10-01",
      end_date: "2026-10-05",
    },
    {
      start_date: "2026-10-07",
      end_date: "2026-10-10",
    },
  ]);

  const nistCalls = [];
  const savedRanges = [];

  t.mock.method(nistService, "getCves", async (from, to) => {
    nistCalls.push([from, to]);

    return emptyResponse;
  });

  t.mock.method(cveRepository, "saveSyncRange", async (from, to) => {
    savedRanges.push([from, to]);
  });

  const result = await cveService.syncCves("2026-10-01", "2026-10-10");

  assert.deepEqual(nistCalls, [["2026-10-06", "2026-10-06"]]);

  assert.deepEqual(savedRanges, nistCalls);

  assert.deepEqual(result.synchronizedRanges, [
    {
      from: "2026-10-06",
      to: "2026-10-06",
    },
  ]);
});

test("syncCves combina periodos superpuestos y consecutivos", async (t) => {
  t.mock.method(cveRepository, "getSyncRanges", async () => [
    {
      start_date: "2026-10-04",
      end_date: "2026-10-06",
    },
    {
      start_date: "2026-10-01",
      end_date: "2026-10-04",
    },
    {
      start_date: "2026-10-07",
      end_date: "2026-10-09",
    },
  ]);

  const nistMock = t.mock.method(
    nistService,
    "getCves",
    async () => emptyResponse,
  );

  const result = await cveService.syncCves("2026-10-01", "2026-10-09");

  assert.equal(result.requestedNist, false);
  assert.equal(nistMock.mock.calls.length, 0);
});

test("syncCves identifica varios huecos al principio, en medio y al final", async (t) => {
  silenceLogs(t);

  t.mock.method(cveRepository, "getSyncRanges", async () => [
    {
      start_date: "2026-10-03",
      end_date: "2026-10-04",
    },
    {
      start_date: "2026-10-07",
      end_date: "2026-10-08",
    },
  ]);

  const calls = [];

  t.mock.method(nistService, "getCves", async (from, to) => {
    calls.push([from, to]);

    return emptyResponse;
  });

  t.mock.method(cveRepository, "saveSyncRange", async () => {});

  await cveService.syncCves("2026-10-01", "2026-10-10");

  assert.deepEqual(calls, [
    ["2026-10-01", "2026-10-02"],
    ["2026-10-05", "2026-10-06"],
    ["2026-10-09", "2026-10-10"],
  ]);
});

test("syncCves divide periodos extensos en bloques de hasta 120 días", async (t) => {
  silenceLogs(t);

  t.mock.method(cveRepository, "getSyncRanges", async () => []);

  const calls = [];

  t.mock.method(nistService, "getCves", async (from, to) => {
    calls.push([from, to]);

    return emptyResponse;
  });

  t.mock.method(cveRepository, "saveSyncRange", async () => {});

  const result = await cveService.syncCves("2026-01-01", "2026-05-02");

  assert.deepEqual(calls, [
    ["2026-01-01", "2026-04-30"],
    ["2026-05-01", "2026-05-02"],
  ]);

  assert.equal(result.synchronizedRanges.length, 2);
});

// NORMALIZACIÓN DE DATOS DE NIST

test("syncCves normaliza datos generales, métricas, productos, debilidades y referencias", async (t) => {
  silenceLogs(t);

  t.mock.method(cveRepository, "getSyncRanges", async () => []);

  const rawCve = vulnerability("CVE-2026-TEST", {
    sourceIdentifier: "security@example.org",
    published: "2026-10-01T12:00:00.000",
    lastModified: "2026-10-02T15:00:00.000",
    vulnStatus: "Analyzed",

    descriptions: [
      {
        lang: "en",
        value: "English description",
      },
      {
        lang: "es",
        value: "Descripción española",
      },
    ],

    metrics: {
      cvssMetricV31: [
        {
          source: "NVD",
          type: "Primary",
          exploitabilityScore: 3.9,
          impactScore: 5.9,
          cvssData: {
            version: "3.1",
            baseScore: 9.8,
            baseSeverity: "CRITICAL",
            vectorString: "CVSS:3.1/AV:N/AC:L",
          },
        },
      ],

      cvssMetricV2: [
        {
          baseSeverity: "MEDIUM",
          cvssData: {
            version: "2.0",
            baseScore: 5,
          },
        },
      ],
    },

    affected: [
      {
        affectedData: [
          {
            vendor: "example",
            product: "test-app",
            packageName: "example/test-app",
            collectionURL: "https://example.org",
            defaultStatus: "unaffected",

            versions: [
              {
                version: "1.0",
                lessThan: "2.0",
                versionType: "semver",
                status: "affected",
              },
            ],
          },
        ],
      },
    ],

    weaknesses: [
      {
        source: "NVD",
        type: "Primary",
        description: [
          {
            lang: "es",
            value: "No guardar",
          },
          {
            lang: "en",
            value: "CWE-79",
          },
        ],
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

  t.mock.method(nistService, "getCves", async () => ({
    vulnerabilities: [rawCve],
    totalResults: 1,
  }));

  const saved = [];

  t.mock.method(cveRepository, "saveCve", async (item) => {
    saved.push(item);
  });

  t.mock.method(cveRepository, "saveSyncRange", async () => {});

  const result = await cveService.syncCves("2026-10-01", "2026-10-01");

  assert.equal(result.synchronized, 1);
  assert.equal(result.totalResults, 1);
  assert.equal(saved.length, 1);

  assert.deepEqual(saved[0].cve, {
    cveId: "CVE-2026-TEST",
    sourceIdentifier: "security@example.org",
    descriptionEn: "English description",
    descriptionEs: "Descripción española",
    publishedAt: "2026-10-01T12:00:00.000",
    lastModifiedAt: "2026-10-02T15:00:00.000",
    status: "Analyzed",
  });

  assert.equal(saved[0].metrics.length, 2);
  assert.equal(saved[0].metrics[0].score, 9.8);
  assert.equal(saved[0].metrics[0].severity, "CRITICAL");
  assert.equal(saved[0].metrics[1].severity, "MEDIUM");

  assert.deepEqual(saved[0].products[0], {
    vendor: "example",
    product: "test-app",
    packageName: "example/test-app",
    collectionUrl: "https://example.org",
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
  });

  assert.deepEqual(saved[0].weaknesses, [
    {
      weaknessCode: "CWE-79",
      source: "NVD",
      type: "Primary",
    },
  ]);

  assert.deepEqual(saved[0].references, [
    {
      url: "https://example.org/advisory",
      source: "NVD",
      tags: ["Vendor Advisory"],
    },
  ]);
});

test("syncCves usa valores por defecto cuando NIST no envía datos opcionales", async (t) => {
  silenceLogs(t);

  t.mock.method(cveRepository, "getSyncRanges", async () => []);

  t.mock.method(nistService, "getCves", async () => ({
    vulnerabilities: [vulnerability("CVE-TEST-MINIMAL")],
    totalResults: 1,
  }));

  let saved;

  t.mock.method(cveRepository, "saveCve", async (item) => {
    saved = item;
  });

  t.mock.method(cveRepository, "saveSyncRange", async () => {});

  await cveService.syncCves("2026-10-01", "2026-10-01");

  assert.equal(saved.cve.cveId, "CVE-TEST-MINIMAL");
  assert.equal(saved.cve.descriptionEn, null);
  assert.equal(saved.cve.descriptionEs, null);

  assert.deepEqual(saved.metrics, []);
  assert.deepEqual(saved.products, []);
  assert.deepEqual(saved.weaknesses, []);
  assert.deepEqual(saved.references, []);
});

// GESTIÓN DE ERRORES

test("syncCves no marca como sincronizado un periodo si NIST falla", async (t) => {
  silenceLogs(t);

  t.mock.method(cveRepository, "getSyncRanges", async () => []);

  t.mock.method(nistService, "getCves", async () => {
    throw new Error("Timeout de NIST");
  });

  const savedRange = t.mock.method(
    cveRepository,
    "saveSyncRange",
    async () => {},
  );

  await assert.rejects(
    cveService.syncCves("2026-10-01", "2026-10-01"),
    /Timeout de NIST/,
  );

  assert.equal(savedRange.mock.calls.length, 0);
});

test("syncCves no marca como sincronizado un periodo si MySQL falla al guardar", async (t) => {
  silenceLogs(t);

  t.mock.method(cveRepository, "getSyncRanges", async () => []);

  t.mock.method(nistService, "getCves", async () => ({
    vulnerabilities: [vulnerability("CVE-TEST-1")],
    totalResults: 1,
  }));

  t.mock.method(cveRepository, "saveCve", async () => {
    throw new Error("Error de MySQL");
  });

  const savedRange = t.mock.method(
    cveRepository,
    "saveSyncRange",
    async () => {},
  );

  await assert.rejects(
    cveService.syncCves("2026-10-01", "2026-10-01"),
    /Error de MySQL/,
  );

  assert.equal(savedRange.mock.calls.length, 0);
});

// VULNERABILIDADES MODIFICADAS

test("syncModifiedCves actualiza y normaliza las CVEs modificadas", async (t) => {
  silenceLogs(t);

  t.mock.method(nistService, "getModifiedCves", async (from, to) => {
    assert.equal(from, "2026-10-03");
    assert.equal(to, "2026-10-04");

    return {
      vulnerabilities: [
        vulnerability("CVE-TEST-1", {
          vulnStatus: "Analyzed",
        }),
        vulnerability("CVE-TEST-2", {
          vulnStatus: "Modified",
        }),
      ],
      totalResults: 2,
    };
  });

  const saved = [];

  t.mock.method(cveRepository, "saveCve", async (item) => {
    saved.push(item);
  });

  const result = await cveService.syncModifiedCves("2026-10-03", "2026-10-04");

  assert.deepEqual(
    saved.map((item) => item.cve.cveId),
    ["CVE-TEST-1", "CVE-TEST-2"],
  );

  assert.deepEqual(result, {
    synchronized: 2,
    totalResults: 2,
  });
});

test("syncModifiedCves propaga fallos de NIST", async (t) => {
  t.mock.method(nistService, "getModifiedCves", async () => {
    throw new Error("NIST no disponible");
  });

  const save = t.mock.method(cveRepository, "saveCve", async () => {});

  await assert.rejects(
    cveService.syncModifiedCves("2026-10-03", "2026-10-04"),
    /NIST no disponible/,
  );

  assert.equal(save.mock.calls.length, 0);
});
