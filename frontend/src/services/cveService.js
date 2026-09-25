const API_URL = "http://localhost:3000/api/cves";

export const getCves = async (
  page = 1,
  limit = 5,
  cveId = "",
  severity = "",
  product = "",
  from = "",
  to = "",
) => {
  const params = new URLSearchParams({
    page,
    limit,
  });

  if (cveId) params.append("cveId", cveId);
  if (severity) params.append("severity", severity);
  if (product) params.append("product", product);
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const response = await fetch(`${API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Error al obtener las vulnerabilidades");
  }

  return response.json();
};
