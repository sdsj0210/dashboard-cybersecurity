import { useEffect, useState } from "react";
import { getCves } from "./services/cveService";

function App() {
  const [cves, setCves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCves = async () => {
      try {
        const result = await getCves();

        setCves(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCves();
  }, []);

  if (loading) {
    return <p>Cargando vulnerabilidades...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <main>
      <h1>Dashboard de Ciberseguridad</h1>

      <h2>Conexión con el backend</h2>

      <p>Vulnerabilidades recibidas: {cves.length}</p>

      {cves.length === 0 ? (
        <p>No se encontraron vulnerabilidades.</p>
      ) : (
        <ul>
          {cves.map((cve) => (
            <li key={cve.cve_id}>
              <strong>{cve.cve_id}</strong>
              {" — "}
              {cve.severity ?? "Sin severidad"}
              {" — "}
              CVSS: {cve.score ?? "N/D"}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default App;
