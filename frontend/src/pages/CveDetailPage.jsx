import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import Layout from "@/components/Layout";
import CveMetrics from "@/components/CveMetrics";
import CveAffectedProducts from "@/components/CveAffectedProducts";
import CveReferences from "@/components/CveReferences";

import { getCveById } from "@/services/cveService";

function CveDetailPage() {
  const { cveId } = useParams();
  const location = useLocation();

  const returnTo = location.state?.returnTo || "/";

  const [cve, setCve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadCve = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getCveById(cveId);

        if (active) {
          setCve(result);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCve();

    return () => {
      active = false;
    };
  }, [cveId]);

  return (
    <Layout>
      <div className="space-y-6">
        <Link
          to={returnTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a vulnerabilidades
        </Link>

        {loading ? (
          <p>Cargando vulnerabilidad...</p>
        ) : error ? (
          <p role="alert" className="text-destructive">
            Error: {error}
          </p>
        ) : !cve ? (
          <p>No se encontró la vulnerabilidad.</p>
        ) : (
          <>
            <h2 className="text-2xl font-semibold">{cve.cve_id}</h2>

            <p>
              {cve.description_es ?? cve.description_en ?? "Sin descripción"}
            </p>

            <div className="min-w-0 space-y-4 wrap-break-word">
              <div>
                <p className="text-sm text-muted-foreground">Publicado</p>
                <p>
                  {cve.published_at
                    ? new Date(cve.published_at).toLocaleDateString()
                    : "N/D"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Última modificación
                </p>
                <p>
                  {cve.last_modified_at
                    ? new Date(cve.last_modified_at).toLocaleDateString()
                    : "N/D"}
                </p>
              </div>

              <CveMetrics metrics={cve.metrics} />

              <CveAffectedProducts products={cve.products} />

              <CveReferences references={cve.references} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default CveDetailPage;
