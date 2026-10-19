import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCves } from "@/services/cveService";

import Layout from "@/components/Layout";
import CveFilters from "@/components/CveFilters";
import CveTable from "@/components/CveTable";
import CvePagination from "@/components/CvePagination";

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

function CveListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const cveId = searchParams.get("cveId") || "";
  const severity = searchParams.get("severity") || "";
  const productFilter = searchParams.get("product") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const [search, setSearch] = useState(cveId);
  const [product, setProduct] = useState(productFilter);

  const [dateFrom, setDateFrom] = useState(from);
  const [dateTo, setDateTo] = useState(to);

  const [dateError, setDateError] = useState("");

  useEffect(() => {
    setDateFrom(from);
    setDateTo(to);
    setDateError("");
  }, [from, to]);

  const [cves, setCves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const updateFilters = (changes) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);

      Object.entries(changes).forEach(([key, value]) => {
        if (value) {
          next.set(key, String(value));
        } else {
          next.delete(key);
        }
      });

      return next;
    });
  };

  const handleSearch = () => {
    if (
      (dateFrom && !isValidDate(dateFrom)) ||
      (dateTo && !isValidDate(dateTo))
    ) {
      setDateError("Introduce fechas válidas.");
      return;
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateError("La fecha inicial no puede ser posterior a la final.");
      return;
    }

    setDateError("");

    updateFilters({
      cveId: search.trim(),
      product: product.trim(),
      from: dateFrom,
      to: dateTo,
      page: "",
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

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

        if (active) {
          setCves(result.data);
          setPagination(result.pagination);
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

    loadCves();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, cveId, severity, productFilter, from, to]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Vulnerabilidades
          </h2>

          <p className="text-sm text-muted-foreground">
            Resumen de vulnerabilidades registradas en el sistema.
          </p>
        </div>

        <CveFilters
          key={`${from}-${to}`}
          search={search}
          product={product}
          severity={severity}
          from={dateFrom}
          to={dateTo}
          onSearchChange={setSearch}
          onProductChange={setProduct}
          onSeverityChange={(value) =>
            updateFilters({
              severity: value === "ALL" ? "" : value,
              page: "",
            })
          }
          onFromChange={setDateFrom}
          onToChange={setDateTo}
          onSearch={handleSearch}
          onClear={() => {
            setSearch("");
            setProduct("");
            setDateFrom("");
            setDateTo("");
            setDateError("");
            setSearchParams({});
          }}
        />

        {dateError && (
          <p role="alert" className="text-sm text-destructive">
            {dateError}
          </p>
        )}

        <div>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando vulnerabilidades...
            </p>
          ) : error ? (
            <p
              role="alert"
              className="py-8 text-center text-sm text-destructive"
            >
              Error: {error}
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">
                Vulnerabilidades encontradas: {pagination?.total ?? 0}
              </p>

              <CveTable cves={cves} />

              <CvePagination
                page={page}
                pagination={pagination}
                onPrevious={() => updateFilters({ page: page - 1 })}
                onNext={() => updateFilters({ page: page + 1 })}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default CveListPage;
