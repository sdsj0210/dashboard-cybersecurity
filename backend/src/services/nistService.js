const NIST_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

const RESULTS_PER_PAGE = 2000;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const fetchWithRetry = async (url) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    let retryReason;

    try {
      const response = await fetch(url, {
        headers: {
          ...(process.env.NVD_API_KEY
            ? { apiKey: process.env.NVD_API_KEY }
            : {}),
        },
        signal: controller.signal,
      });

      if (response.ok) {
        return await response.json();
      }

      const message = response.headers.get("message");

      const errorMessage = `NIST respondió ${response.status}${
        message ? `: ${message}` : ""
      }`;

      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      if (!retryable) {
        throw new Error(errorMessage);
      }

      retryReason = errorMessage;
    } catch (error) {
      if (error.name === "AbortError") {
        retryReason = `La solicitud a NIST superó ${
          REQUEST_TIMEOUT_MS / 1000
        } segundos`;
      } else if (error instanceof TypeError) {
        retryReason = `Error de red al consultar NIST: ${error.message}`;
      } else {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }

    if (attempt === MAX_RETRIES) {
      throw new Error(
        `${retryReason}. Se agotaron los ${MAX_RETRIES + 1} intentos`,
      );
    }

    const waitTime = (attempt + 1) * 5000;

    console.warn(
      `${retryReason}. Reintentando en ${waitTime / 1000} segundos...`,
    );

    await sleep(waitTime);
  }
};

const fetchCves = async (params) => {
  let startIndex = 0;
  let totalResults = 0;

  const vulnerabilities = [];

  do {
    const searchParams = new URLSearchParams({
      ...params,
      resultsPerPage: String(RESULTS_PER_PAGE),
      startIndex: String(startIndex),
    });

    searchParams.append("noRejected", "");

    const url = `${NIST_API_URL}?${searchParams.toString()}`;

    const data = await fetchWithRetry(url);

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
