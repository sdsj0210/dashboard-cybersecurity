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

      <div className="mt-6 min-w-0 space-y-4 wrap-break-word">
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
                <div
                  key={index}
                  className="min-w-0 rounded-lg border bg-card p-4"
                >
                  <p>Versión: {metric.version ?? "N/D"}</p>
                  <p>Puntuación: {metric.score ?? "N/D"}</p>
                  <p>Severidad: {metric.severity ?? "N/D"}</p>
                  <p className="break-all">Vector: {metric.vector ?? "N/D"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay métricas disponibles.</p>
          )}
        </div>

        <section className="space-y-2">
          <h3 className="font-semibold">Productos afectados</h3>

          {cve.products?.length > 0 ? (
            cve.products.map((product) => (
              <div
                key={product.id}
                className="min-w-0 rounded-lg border bg-card p-4"
              >
                <p>Proveedor: {product.vendor ?? "N/D"}</p>
                <p>Producto: {product.product ?? "N/D"}</p>
                <p>Paquete: {product.package_name ?? "N/D"}</p>

                {product.versions?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Versiones afectadas</p>

                    {product.versions.map((version, index) => (
                      <p key={index} className="break-all">
                        {version.version ?? "N/D"}
                        {version.less_than &&
                          ` - anterior a ${version.less_than}`}
                        {version.less_than_or_equal &&
                          ` - hasta ${version.less_than_or_equal}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay productos disponibles.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">Referencias externas</h3>

          {cve.references?.length > 0 ? (
            <ul className="space-y-2">
              {cve.references.map((reference, index) => (
                <li key={index} className="break-all">
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {reference.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay referencias disponibles.
            </p>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default CveDetailPage;
