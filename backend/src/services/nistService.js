const NIST_API_URL =
  "https://services.nvd.nist.gov/rest/json/cves/2.0" +
  "?pubStartDate=2025-01-01T00:00:00.000" +
  "&pubEndDate=2025-01-31T23:59:59.999" +
  "&noRejected" +
  "&resultsPerPage=20";

const getCves = async () => {
  const response = await fetch(NIST_API_URL);

  if (!response.ok) {
    throw new Error(`Error al consultar NIST: ${response.status}`);
  }

  return await response.json();
};

module.exports = {
  getCves,
};
