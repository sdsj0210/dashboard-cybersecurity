const db = require("../config/database");

const getAllCves = async (filters = {}) => {
  let query = `
    SELECT DISTINCT
      c.id,
      c.cve_id,
      c.source_identifier,
      c.description_en,
      c.description_es,
      c.published_at,
      c.last_modified_at,
      c.status,

      m.score,
      m.severity,
      m.version AS score_version,

      p.vendor,
      p.product

    FROM cves c

    LEFT JOIN cve_metrics m
      ON m.cve_id = c.id
      AND m.type = 'Primary'

    LEFT JOIN cve_products p
      ON p.cve_id = c.id

    WHERE 1 = 1
  `;

  const params = [];

  if (filters.severity) {
    query += `
      AND m.severity = ?
    `;

    params.push(filters.severity);
  }

  if (filters.product) {
    query += `
      AND p.product LIKE ?
    `;

    params.push(`%${filters.product}%`);
  }

  if (filters.from) {
    query += `
      AND c.published_at >= ?
    `;

    params.push(filters.from);
  }

  if (filters.to) {
    query += `
      AND c.published_at < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    params.push(filters.to);
  }

  if (filters.cveId) {
    query += `
      AND c.cve_id = ?
    `;

    params.push(filters.cveId);
  }

  query += `
    ORDER BY c.published_at DESC
  `;

  const [rows] = await db.query(query, params);

  return rows;
};

const saveCve = async (data) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const cveId = await saveGeneralData(connection, data.cve);

    await clearRelatedData(connection, cveId);

    await saveMetrics(connection, cveId, data.metrics);

    await saveProducts(connection, cveId, data.products);

    await saveWeaknesses(connection, cveId, data.weaknesses);

    await saveReferences(connection, cveId, data.references);

    await connection.commit();
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
};

const saveGeneralData = async (connection, cve) => {
  await connection.query(
    `
    INSERT INTO cves (
      cve_id,
      source_identifier,
      description_en,
      description_es,
      published_at,
      last_modified_at,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)

    ON DUPLICATE KEY UPDATE
      source_identifier = VALUES(source_identifier),
      description_en = VALUES(description_en),
      description_es = VALUES(description_es),
      published_at = VALUES(published_at),
      last_modified_at = VALUES(last_modified_at),
      status = VALUES(status)
    `,
    [
      cve.cveId,
      cve.sourceIdentifier,
      cve.descriptionEn,
      cve.descriptionEs,
      cve.publishedAt,
      cve.lastModifiedAt,
      cve.status,
    ],
  );

  const [rows] = await connection.query(
    `
    SELECT id
    FROM cves
    WHERE cve_id = ?
    `,
    [cve.cveId],
  );

  return rows[0].id;
};

const clearRelatedData = async (connection, cveId) => {
  await connection.query("DELETE FROM cve_metrics WHERE cve_id = ?", [cveId]);

  await connection.query("DELETE FROM cve_weaknesses WHERE cve_id = ?", [
    cveId,
  ]);

  await connection.query("DELETE FROM cve_references WHERE cve_id = ?", [
    cveId,
  ]);

  await connection.query("DELETE FROM cve_products WHERE cve_id = ?", [cveId]);
};

const saveMetrics = async (connection, cveId, metrics) => {
  for (const metric of metrics) {
    await connection.query(
      `
      INSERT INTO cve_metrics (
        cve_id,
        version,
        score,
        severity,
        vector,
        source,
        type,
        exploitability_score,
        impact_score
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        cveId,
        metric.version,
        metric.score,
        metric.severity,
        metric.vector,
        metric.source,
        metric.type,
        metric.exploitabilityScore,
        metric.impactScore,
      ],
    );
  }
};

const saveProducts = async (connection, cveId, products) => {
  for (const product of products) {
    const [result] = await connection.query(
      `
      INSERT INTO cve_products (
        cve_id,
        vendor,
        product,
        package_name,
        collection_url,
        default_status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        cveId,
        product.vendor,
        product.product,
        product.packageName,
        product.collectionUrl,
        product.defaultStatus,
      ],
    );

    const productId = result.insertId;

    for (const version of product.versions) {
      await connection.query(
        `
        INSERT INTO cve_product_versions (
          cve_product_id,
          version,
          less_than,
          less_than_or_equal,
          version_type,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          productId,
          version.version,
          version.lessThan,
          version.lessThanOrEqual,
          version.versionType,
          version.status,
        ],
      );
    }
  }
};

const saveWeaknesses = async (connection, cveId, weaknesses) => {
  for (const weakness of weaknesses) {
    await connection.query(
      `
      INSERT INTO cve_weaknesses (
        cve_id,
        weakness_code,
        source,
        type
      )
      VALUES (?, ?, ?, ?)
      `,
      [cveId, weakness.weaknessCode, weakness.source, weakness.type],
    );
  }
};

const saveReferences = async (connection, cveId, references) => {
  for (const reference of references) {
    await connection.query(
      `
      INSERT INTO cve_references (
        cve_id,
        url,
        source,
        tags
      )
      VALUES (?, ?, ?, ?)
      `,
      [cveId, reference.url, reference.source, JSON.stringify(reference.tags)],
    );
  }
};

const getCveById = async (cveId) => {
  const [cveRows] = await db.query(
    `
    SELECT
      id,
      cve_id,
      source_identifier,
      description_en,
      description_es,
      published_at,
      last_modified_at,
      status
    FROM cves
    WHERE cve_id = ?
    `,
    [cveId],
  );

  if (cveRows.length === 0) {
    return null;
  }

  const cve = cveRows[0];

  const [metrics] = await db.query(
    `
    SELECT
      version,
      score,
      severity,
      vector,
      source,
      type,
      exploitability_score,
      impact_score
    FROM cve_metrics
    WHERE cve_id = ?
    `,
    [cve.id],
  );

  const [products] = await db.query(
    `
    SELECT
      id,
      vendor,
      product,
      package_name,
      collection_url,
      default_status
    FROM cve_products
    WHERE cve_id = ?
    `,
    [cve.id],
  );

  for (const product of products) {
    const [versions] = await db.query(
      `
      SELECT
        version,
        less_than,
        less_than_or_equal,
        version_type,
        status
      FROM cve_product_versions
      WHERE cve_product_id = ?
      `,
      [product.id],
    );

    product.versions = versions;
  }

  const [weaknesses] = await db.query(
    `
    SELECT
      weakness_code,
      source,
      type
    FROM cve_weaknesses
    WHERE cve_id = ?
    `,
    [cve.id],
  );

  const [references] = await db.query(
    `
    SELECT
      url,
      source,
      tags
    FROM cve_references
    WHERE cve_id = ?
    `,
    [cve.id],
  );

  return {
    ...cve,
    metrics,
    products,
    weaknesses,
    references,
  };
};

const getSyncRanges = async () => {
  const [rows] = await db.query(`
    SELECT
      id,
      start_date,
      end_date,
      synchronized_at
    FROM sync_ranges
    ORDER BY start_date ASC
  `);

  return rows;
};

const saveSyncRange = async (startDate, endDate) => {
  await db.query(
    `
    INSERT INTO sync_ranges (
      start_date,
      end_date
    )
    VALUES (?, ?)
    `,
    [startDate, endDate],
  );
};

module.exports = {
  getAllCves,
  getCveById,
  saveCve,
  getSyncRanges,
  saveSyncRange,
};
