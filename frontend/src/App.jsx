import { useEffect, useState } from "react";
import { getCves } from "./services/cveService";

import Layout from "@/components/Layout";
import CveFilters from "@/components/CveFilters";
import CveTable from "@/components/CveTable";
import CvePagination from "@/components/CvePagination";

function App() {
  const [cves, setCves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [search, setSearch] = useState("");
  const [cveId, setCveId] = useState("");

  const [severity, setSeverity] = useState("");

  const [product, setProduct] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const loadCves = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getCves(
          page,
          5,
          cveId,
          severity,
          productFilter,
          from,
          to,
        );

        setCves(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCves();
  }, [page, cveId, severity, productFilter, from, to]);

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

        <CveFilters
          search={search}
          product={product}
          severity={severity}
          from={from}
          to={to}
          onSearchChange={setSearch}
          onProductChange={setProduct}
          onSeverityChange={(value) => {
            setPage(1);
            setSeverity(value === "ALL" ? "" : value);
          }}
          onFromChange={(value) => {
            setPage(1);
            setFrom(value);
          }}
          onToChange={(value) => {
            setPage(1);
            setTo(value);
          }}
          onSearch={() => {
            setPage(1);
            setCveId(search.trim());
            setProductFilter(product.trim());
          }}
          onClear={() => {
            setSearch("");
            setCveId("");
            setSeverity("");
            setProduct("");
            setProductFilter("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
        />

        <div>
          <p className="mb-1">Vulnerabilidades recibidas: {cves.length}</p>

          <CveTable cves={cves} />

          <CvePagination
            page={page}
            pagination={pagination}
            onPrevious={() => setPage(page - 1)}
            onNext={() => setPage(page + 1)}
          />
        </div>
      </div>
    </Layout>
  );
}

export default App;
