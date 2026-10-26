import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderHook, waitFor } from "@testing-library/react";

import useCves from "@/hooks/useCves";
import { getCves } from "@/services/cveService";

vi.mock("@/services/cveService", () => ({
  getCves: vi.fn(),
}));

const defaultFilters = {
  page: 1,
  cveId: "",
  severity: "",
  productFilter: "",
  from: "",
  to: "",
};

const mockResponse = {
  data: [
    {
      cve_id: "CVE-2026-1234",
      score: 9.8,
      severity: "CRITICAL",
    },
  ],
  pagination: {
    page: 1,
    limit: 5,
    total: 1,
    totalPages: 1,
  },
};

const deferred = () => {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useCves", () => {
  it("comienza en estado de carga", async () => {
    const pending = deferred();

    getCves.mockReturnValue(pending.promise);

    const { result } = renderHook(() => useCves(defaultFilters));

    expect(result.current.loading).toBe(true);
    expect(result.current.cves).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      pending.resolve(mockResponse);
    });
  });

  it("consulta el backend con todos los filtros", async () => {
    getCves.mockResolvedValue(mockResponse);

    const filters = {
      page: 2,
      cveId: "CVE-2026-1234",
      severity: "HIGH",
      productFilter: "linux",
      from: "2026-10-01",
      to: "2026-10-24",
    };

    const { result } = renderHook(() => useCves(filters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getCves).toHaveBeenCalledWith(
      2,
      5,
      "CVE-2026-1234",
      "HIGH",
      "linux",
      "2026-10-01",
      "2026-10-24",
    );

    expect(result.current.cves).toEqual(mockResponse.data);

    expect(result.current.pagination).toEqual(mockResponse.pagination);

    expect(result.current.error).toBeNull();
  });

  it("gestiona correctamente una búsqueda sin resultados", async () => {
    getCves.mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0,
      },
    });

    const { result } = renderHook(() => useCves(defaultFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cves).toEqual([]);
    expect(result.current.pagination.total).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("muestra un error cuando falla la consulta al backend", async () => {
    getCves.mockRejectedValue(new Error("Backend no disponible"));

    const { result } = renderHook(() => useCves(defaultFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Backend no disponible");

    expect(result.current.cves).toEqual([]);
  });

  it("vuelve a consultar el backend cuando cambian los filtros", async () => {
    const firstResponse = mockResponse;

    const secondResponse = {
      data: [
        {
          cve_id: "CVE-2026-5678",
          score: 7.5,
          severity: "HIGH",
        },
      ],
      pagination: {
        page: 2,
        limit: 5,
        total: 10,
        totalPages: 2,
      },
    };

    getCves
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);

    const { result, rerender } = renderHook(({ filters }) => useCves(filters), {
      initialProps: {
        filters: defaultFilters,
      },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cves).toEqual(firstResponse.data);

    rerender({
      filters: {
        ...defaultFilters,
        page: 2,
        severity: "HIGH",
      },
    });

    await waitFor(() => {
      expect(result.current.pagination.page).toBe(2);
    });

    expect(getCves).toHaveBeenCalledTimes(2);

    expect(getCves).toHaveBeenLastCalledWith(2, 5, "", "HIGH", "", "", "");

    expect(result.current.cves).toEqual(secondResponse.data);

    expect(result.current.loading).toBe(false);
  });

  it("ignora respuestas antiguas cuando una búsqueda nueva termina primero", async () => {
    const firstRequest = deferred();
    const secondRequest = deferred();

    getCves
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result, rerender } = renderHook(({ filters }) => useCves(filters), {
      initialProps: {
        filters: defaultFilters,
      },
    });

    rerender({
      filters: {
        ...defaultFilters,
        severity: "CRITICAL",
      },
    });

    const newResponse = {
      data: [
        {
          cve_id: "CVE-NUEVA",
          severity: "CRITICAL",
        },
      ],
      pagination: {
        page: 1,
        total: 1,
        totalPages: 1,
      },
    };

    await act(async () => {
      secondRequest.resolve(newResponse);
    });

    expect(result.current.cves).toEqual(newResponse.data);

    await act(async () => {
      firstRequest.resolve(mockResponse);
    });

    expect(result.current.cves).toEqual(newResponse.data);

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ignora respuestas pendientes después de desmontar el componente", async () => {
    const pending = deferred();

    getCves.mockReturnValue(pending.promise);

    const { unmount } = renderHook(() => useCves(defaultFilters));

    expect(getCves).toHaveBeenCalledOnce();

    unmount();

    await act(async () => {
      pending.resolve(mockResponse);
    });

    expect(getCves).toHaveBeenCalledOnce();
  });
});
