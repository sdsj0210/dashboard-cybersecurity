import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "@/components/Layout";
import { getCveById } from "@/services/cveService";

function CveDetailPage() {
  const { cveId } = useParams();

  const [cve, setCve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCve = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getCveById(cveId);

        setCve(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCve();
  }, [cveId]);

  if (loading) {
    return <p>Cargando vulnerabilidad...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <Layout>
      <h2 className="text-2xl font-semibold">{cve.cve_id}</h2>

      <p className="mt-4">
        {cve.description_es ?? cve.description_en ?? "Sin descripción"}
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Publicado</p>
          <p>
            {cve.published_at
              ? new Date(cve.published_at).toLocaleDateString()
              : "N/D"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Última modificación</p>
          <p>
            {cve.last_modified_at
              ? new Date(cve.last_modified_at).toLocaleDateString()
              : "N/D"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Métricas CVSS</p>

          {cve.metrics?.length > 0 ? (
            <div className="space-y-2">
              {cve.metrics.map((metric, index) => (
                <div key={index} className="rounded-lg border bg-card p-4">
                  <p>Versión: {metric.version ?? "N/D"}</p>
                  <p>Puntuación: {metric.score ?? "N/D"}</p>
                  <p>Severidad: {metric.severity ?? "N/D"}</p>
                  <p>Vector: {metric.vector ?? "N/D"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay métricas disponibles.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default CveDetailPage;
