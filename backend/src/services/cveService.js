const nistService = require("./nistService");
const cveRepository = require("../repositories/cveRepository");

const getCves = async (filters = {}) => {
  const cves = await cveRepository.getAllCves(filters);

  return cves.map((cve) => ({
    ...cve,
    score: cve.score !== null ? Number(cve.score) : null,
  }));
};

const formatDate = (date) => {
  return date.toISOString().slice(0, 10);
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return formatDate(date);
};

const normalizeDate = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

const getMissingRanges = (from, to, syncRanges) => {
  const relevantRanges = syncRanges
    .map((range) => ({
      start: normalizeDate(range.start_date),
      end: normalizeDate(range.end_date),
    }))
    .filter((range) => {
      return range.end >= from && range.start <= to;
    })
    .map((range) => ({
      start: range.start < from ? from : range.start,
      end: range.end > to ? to : range.end,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

  if (relevantRanges.length === 0) {
    return [
      {
        from,
        to,
      },
    ];
  }

  const mergedRanges = [];

  for (const range of relevantRanges) {
    const lastRange = mergedRanges[mergedRanges.length - 1];

    if (!lastRange) {
      mergedRanges.push(range);
      continue;
    }

    const dayAfterLastRange = addDays(lastRange.end, 1);

    if (range.start <= dayAfterLastRange) {
      if (range.end > lastRange.end) {
        lastRange.end = range.end;
      }
    } else {
      mergedRanges.push(range);
    }
  }

  const missingRanges = [];

  let currentDate = from;

  for (const range of mergedRanges) {
    if (currentDate < range.start) {
      missingRanges.push({
        from: currentDate,
        to: addDays(range.start, -1),
      });
    }

    const dayAfterRange = addDays(range.end, 1);

    if (dayAfterRange > currentDate) {
      currentDate = dayAfterRange;
    }
  }

  if (currentDate <= to) {
    missingRanges.push({
      from: currentDate,
      to,
    });
  }

  return missingRanges;
};

const syncCves = async (from, to) => {
  const syncRanges = await cveRepository.getSyncRanges();

  const missingRanges = getMissingRanges(from, to, syncRanges);

  if (missingRanges.length === 0) {
    return {
      synchronized: 0,
      totalResults: 0,
      from,
      to,
      requestedNist: false,
      synchronizedRanges: [],
    };
  }

  let synchronized = 0;
  let totalResults = 0;

  const synchronizedRanges = [];

  for (const range of missingRanges) {
    const data = await nistService.getCves(range.from, range.to);

    const vulnerabilities = data.vulnerabilities || [];

    for (const vulnerability of vulnerabilities) {
      const normalizedCve = normalizeCve(vulnerability.cve);

      await cveRepository.saveCve(normalizedCve);
    }

    await cveRepository.saveSyncRange(range.from, range.to);

    synchronized += vulnerabilities.length;
    totalResults += data.totalResults || 0;

    synchronizedRanges.push(range);
  }

  return {
    synchronized,
    totalResults,
    from,
    to,
    requestedNist: true,
    synchronizedRanges,
  };
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

const getCveById = async (cveId) => {
  const cve = await cveRepository.getCveById(cveId);

  if (!cve) {
    return null;
  }

  return {
    ...cve,

    metrics: cve.metrics.map((metric) => ({
      ...metric,

      score: metric.score !== null ? Number(metric.score) : null,

      exploitability_score:
        metric.exploitability_score !== null
          ? Number(metric.exploitability_score)
          : null,

      impact_score:
        metric.impact_score !== null ? Number(metric.impact_score) : null,
    })),
  };
};

module.exports = {
  getCves,
  getCveById,
  syncCves,
};
