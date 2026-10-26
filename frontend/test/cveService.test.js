import { afterEach, describe, expect, it, vi } from "vitest";

import { getCves, getCveById } from "@/services/cveService";

const createResponse = (data, ok = true) => ({
  ok,
  json: vi.fn().mockResolvedValue(data),
});

const mockFetchResponse = (data, ok = true) => {
  const fetchMock = vi.fn().mockResolvedValue(createResponse(data, ok));

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getCves", () => {
  it("consulta la primera página con cinco registros por defecto", async () => {
    const data = {
      data: [],
      pagination: {
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0,
      },
    };

    const fetchMock = mockFetchResponse(data);

    const result = await getCves();

    expect(fetchMock).toHaveBeenCalledOnce();

    const url = new URL(fetchMock.mock.calls[0][0]);

    expect(url.origin).toBe("http://localhost:3000");
    expect(url.pathname).toBe("/api/cves");

    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("5");

    expect(result).toEqual(data);
  });

  it("envía correctamente todos los filtros al backend", async () => {
    const fetchMock = mockFetchResponse({
      data: [],
      pagination: {
        page: 2,
        limit: 5,
        total: 0,
        totalPages: 0,
      },
    });

    await getCves(
      2,
      5,
      "CVE-2026-1234",
      "HIGH",
      "linux",
      "2026-10-01",
      "2026-10-24",
    );

    const url = new URL(fetchMock.mock.calls[0][0]);

    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "2",
      limit: "5",
      cveId: "CVE-2026-1234",
      severity: "HIGH",
      product: "linux",
      from: "2026-10-01",
      to: "2026-10-24",
    });
  });

  it("no envía filtros opcionales cuando están vacíos", async () => {
    const fetchMock = mockFetchResponse({
      data: [],
      pagination: {},
    });

    await getCves(3, 10, "", "", "", "", "");

    const url = new URL(fetchMock.mock.calls[0][0]);

    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "3",
      limit: "10",
    });

    expect(url.searchParams.has("cveId")).toBe(false);
    expect(url.searchParams.has("severity")).toBe(false);
    expect(url.searchParams.has("product")).toBe(false);
    expect(url.searchParams.has("from")).toBe(false);
    expect(url.searchParams.has("to")).toBe(false);
  });

  it("devuelve los registros y la paginación recibidos", async () => {
    const response = {
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

    mockFetchResponse(response);

    const result = await getCves();

    expect(result).toEqual(response);
    expect(result.data).toHaveLength(1);

    expect(result.data[0].cve_id).toBe("CVE-2026-1234");

    expect(result.pagination.total).toBe(1);
  });

  it("lanza un error cuando el backend devuelve una respuesta HTTP fallida", async () => {
    mockFetchResponse(
      {
        message: "Error interno",
      },
      false,
    );

    await expect(getCves()).rejects.toThrow(
      "Error al obtener las vulnerabilidades",
    );
  });

  it("propaga los errores de conexión con el backend", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new Error("No se pudo conectar"));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getCves()).rejects.toThrow("No se pudo conectar");

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("getCveById", () => {
  it("consulta una vulnerabilidad por su identificador", async () => {
    const cve = {
      cve_id: "CVE-2026-1234",
      description_en: "Example vulnerability",
      metrics: [
        {
          version: "3.1",
          score: 9.8,
        },
      ],
      products: [],
      references: [],
    };

    const fetchMock = mockFetchResponse(cve);

    const result = await getCveById("CVE-2026-1234");

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/cves/CVE-2026-1234",
    );

    expect(result).toEqual(cve);
    expect(result.metrics[0].score).toBe(9.8);
  });

  it("lanza un error cuando la vulnerabilidad no existe", async () => {
    mockFetchResponse(
      {
        message: "CVE no encontrada",
      },
      false,
    );

    await expect(getCveById("CVE-2026-9999")).rejects.toThrow(
      "Error al obtener la vulnerabilidad",
    );
  });

  it("propaga un error de conexión al consultar el detalle", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new Error("Backend no disponible"));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getCveById("CVE-2026-1234")).rejects.toThrow(
      "Backend no disponible",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
