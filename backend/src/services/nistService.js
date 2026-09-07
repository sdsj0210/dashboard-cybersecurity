const NIST_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

const RESULTS_PER_PAGE = 2000;

const getCves = async (from, to) => {
  let startIndex = 0;
  let vulnerabilities = [];
  let totalResults = 0;

  do {
    const url =
      `${NIST_API_URL}` +
      `?pubStartDate=${from}T00:00:00.000` +
      `&pubEndDate=${to}T23:59:59.999` +
      `&noRejected` +
      `&resultsPerPage=${RESULTS_PER_PAGE}` +
      `&startIndex=${startIndex}`;

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

module.exports = {
  getCves,
};
