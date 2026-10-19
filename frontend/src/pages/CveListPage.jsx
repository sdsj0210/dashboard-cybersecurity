import Layout from "@/components/Layout";
import CveFilters from "@/components/CveFilters";
import CveTable from "@/components/CveTable";
import CvePagination from "@/components/CvePagination";

import useCveFilters from "@/hooks/useCveFilters";
import useCves from "@/hooks/useCves";

function CveListPage() {
  const { filters, filterProps, dateError, onPrevious, onNext } =
    useCveFilters();

  const { cves, pagination, loading, error } = useCves(filters);

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

        <CveFilters key={`${filters.from}-${filters.to}`} {...filterProps} />

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
                page={filters.page}
                pagination={pagination}
                onPrevious={onPrevious}
                onNext={onNext}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default CveListPage;
