const nistService = require("./nistService");
const cveRepository = require("../repositories/cveRepository");

const getCves = async (filters = {}) => {
  const cves = await cveRepository.getAllCves(filters);

  return cves.map((cve) => ({
    ...cve,
    score: cve.score !== null ? Number(cve.score) : null,
  }));
};

const syncCves = async () => {
  const data = await nistService.getCves();

  const vulnerabilities = data.vulnerabilities || [];

  for (const vulnerability of vulnerabilities) {
    const normalizedCve = normalizeCve(vulnerability.cve);

    await cveRepository.saveCve(normalizedCve);
  }

  return vulnerabilities.length;
};

const normalizeCve = (cve) => {
  return {
    cve: normalizeGeneralData(cve),
    metrics: normalizeMetrics(cve.metrics),
    products: normalizeProducts(cve.affected),
    weaknesses: normalizeWeaknesses(cve.weaknesses),
    references: normalizeReferences(cve.references),
  };
};

const normalizeGeneralData = (cve) => {
  const descriptions = cve.descriptions || [];

  const descriptionEn =
    descriptions.find((description) => description.lang === "en")?.value ||
    null;

  const descriptionEs =
    descriptions.find((description) => description.lang === "es")?.value ||
    null;

  return {
    cveId: cve.id,
    sourceIdentifier: cve.sourceIdentifier || null,
    descriptionEn,
    descriptionEs,
    publishedAt: cve.published || null,
    lastModifiedAt: cve.lastModified || null,
    status: cve.vulnStatus || null,
  };
};

const normalizeMetrics = (metrics = {}) => {
  const result = [];

  const metricGroups = [
    metrics.cvssMetricV40,
    metrics.cvssMetricV31,
    metrics.cvssMetricV30,
    metrics.cvssMetricV2,
  ];

  for (const group of metricGroups) {
    if (!Array.isArray(group)) {
      continue;
    }

    for (const metric of group) {
      const data = metric.cvssData || {};

      result.push({
        version: data.version || null,
        score: data.baseScore ?? null,
        severity: data.baseSeverity || metric.baseSeverity || null,
        vector: data.vectorString || null,
        source: metric.source || null,
        type: metric.type || null,
        exploitabilityScore: metric.exploitabilityScore ?? null,
        impactScore: metric.impactScore ?? null,
      });
    }
  }

  return result;
};

const normalizeProducts = (affected = []) => {
  const products = [];

  for (const affectedGroup of affected) {
    const affectedData = affectedGroup.affectedData || [];

    for (const product of affectedData) {
      products.push({
        vendor: product.vendor || null,
        product: product.product || null,
        packageName: product.packageName || null,
        collectionUrl: product.collectionURL || null,
        defaultStatus: product.defaultStatus || null,

        versions: (product.versions || []).map((version) => ({
          version: version.version || null,
          lessThan: version.lessThan || null,
          lessThanOrEqual: version.lessThanOrEqual || null,
          versionType: version.versionType || null,
          status: version.status || null,
        })),
      });
    }
  }

  return products;
};

const normalizeWeaknesses = (weaknesses = []) => {
  const result = [];

  for (const weakness of weaknesses) {
    const descriptions = weakness.description || [];

    for (const description of descriptions) {
      if (description.lang !== "en") {
        continue;
      }

      result.push({
        weaknessCode: description.value || null,
        source: weakness.source || null,
        type: weakness.type || null,
      });
    }
  }

  return result;
};

const normalizeReferences = (references = []) => {
  return references.map((reference) => ({
    url: reference.url,
    source: reference.source || null,
    tags: reference.tags || [],
  }));
};

module.exports = {
  getCves,
  syncCves,
};
