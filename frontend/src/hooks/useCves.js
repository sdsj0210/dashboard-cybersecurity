import { useEffect, useState } from "react";

import { getCves } from "@/services/cveService";

function useCves({ page, cveId, severity, productFilter, from, to }) {
  const [cves, setCves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    };
  }, [page, cveId, severity, productFilter, from, to]);

  return {
    cves,
    pagination,
    loading,
    error,
  };
}

export default useCves;
