const NIST_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

const RESULTS_PER_PAGE = 2000;

const fetchCves = async (params) => {
  let startIndex = 0;
  let vulnerabilities = [];
  let totalResults = 0;

  do {
    const searchParams = new URLSearchParams({
      ...params,
      resultsPerPage: RESULTS_PER_PAGE.toString(),
      startIndex: startIndex.toString(),
    });

    searchParams.append("noRejected", "");

    const url = `${NIST_API_URL}?${searchParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error al consultar NIST: ${response.status}`);
    }

    const data = await response.json();

    const pageVulnerabilities = data.vulnerabilities || [];

    vulnerabilities.push(...pageVulnerabilities);

    totalResults = data.totalResults || 0;

    startIndex += pageVulnerabilities.length;

    if (pageVulnerabilities.length === 0) {
      break;
    }
  } while (startIndex < totalResults);

  return {
    vulnerabilities,
    totalResults,
  };
};

const getCves = async (from, to) => {
  return fetchCves({
    pubStartDate: `${from}T00:00:00.000`,
    pubEndDate: `${to}T23:59:59.999`,
  });
};

const getModifiedCves = async (from, to) => {
  return fetchCves({
    lastModStartDate: `${from}T00:00:00.000`,
    lastModEndDate: `${to}T23:59:59.999`,
  });
};

module.exports = {
  getCves,
  getModifiedCves,
};
