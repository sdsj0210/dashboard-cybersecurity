import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { isValidDate } from "@/utils/dateUtils";

function useCveFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedPage = Number(searchParams.get("page"));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const cveId = searchParams.get("cveId") || "";
  const severity = searchParams.get("severity") || "";
  const productFilter = searchParams.get("product") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const filters = {
    page,
    cveId,
    severity,
    productFilter,
    from,
    to,
  };

  // Identifica los filtros aplicados en la URL.
  const appliedKey = JSON.stringify([cveId, productFilter, from, to]);

  const initialDraft = {
    key: appliedKey,
    search: cveId,
    product: productFilter,
    dateFrom: from,
    dateTo: to,
    dateError: "",
  };

  const [storedDraft, setStoredDraft] = useState(initialDraft);

  const draft = storedDraft.key === appliedKey ? storedDraft : initialDraft;

  const updateDraft = (changes) => {
    setStoredDraft((previous) => ({
      ...(previous.key === appliedKey ? previous : initialDraft),
      ...changes,
    }));
  };

  const updateFilters = (changes) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);

      Object.entries(changes).forEach(([key, value]) => {
        if (value !== "" && value != null) {
          next.set(key, String(value));
        } else {
          next.delete(key);
        }
      });

      return next;
    });
  };

  const handleSearch = () => {
    const { search, product, dateFrom, dateTo } = draft;

    if (
      (dateFrom && !isValidDate(dateFrom)) ||
      (dateTo && !isValidDate(dateTo))
    ) {
      updateDraft({
        dateError: "Introduce fechas válidas.",
      });
      return;
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      updateDraft({
        dateError: "La fecha inicial no puede ser posterior a la final.",
      });
      return;
    }

    updateDraft({ dateError: "" });

    updateFilters({
      cveId: search.trim(),
      product: product.trim(),
      from: dateFrom,
      to: dateTo,
      page: "",
    });
  };

  const handleClear = () => {
    setStoredDraft({
      key: JSON.stringify(["", "", "", ""]),
      search: "",
      product: "",
      dateFrom: "",
      dateTo: "",
      dateError: "",
    });

    setSearchParams({});
  };

  const filterProps = {
    search: draft.search,
    product: draft.product,
    severity,
    from: draft.dateFrom,
    to: draft.dateTo,

    onSearchChange: (value) => updateDraft({ search: value }),
    onProductChange: (value) => updateDraft({ product: value }),

    onSeverityChange: (value) => {
      updateFilters({
        severity: value === "ALL" ? "" : value,
        page: "",
      });
    },

    onFromChange: (value) => updateDraft({ dateFrom: value }),
    onToChange: (value) => updateDraft({ dateTo: value }),

    onSearch: handleSearch,
    onClear: handleClear,
  };

  return {
    filters,
    filterProps,
    dateError: draft.dateError,

    onPrevious: () => updateFilters({ page: page - 1 }),
    onNext: () => updateFilters({ page: page + 1 }),
  };
}

export default useCveFilters;
