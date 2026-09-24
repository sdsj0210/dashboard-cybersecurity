import { useEffect, useState } from "react";
import { getCves } from "./services/cveService";

import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

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
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>

          <p className="text-sm text-muted-foreground">
            Resumen de vulnerabilidades registradas en el sistema.
          </p>
        </div>

        <div>
          <p>Vulnerabilidades recibidas: {cves.length}</p>

          {cves.map((cve) => (
            <p key={cve.cve_id}>
              <strong>{cve.cve_id}</strong>
              {" — "}
              {cve.severity ?? "Sin severidad"}
              {" — "}
              CVSS: {cve.score ?? "N/D"}
            </p>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default App;
