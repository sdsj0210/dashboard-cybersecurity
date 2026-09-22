const API_URL = "http://localhost:3000/api/cves";

export const getCves = async () => {
  const response = await fetch(`${API_URL}?page=1&limit=5`);

  if (!response.ok) {
    throw new Error("Error al obtener las vulnerabilidades");
  }

  return response.json();
};
