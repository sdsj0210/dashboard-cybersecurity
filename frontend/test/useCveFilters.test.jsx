import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import useCveFilters from "@/hooks/useCveFilters";

const createWrapper = (url = "/") => {
  function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  }

  return Wrapper;
};

describe("useCveFilters", () => {
  it("inicia sin filtros y en la primera página", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper(),
    });

    expect(result.current.filters).toEqual({
      page: 1,
      cveId: "",
      severity: "",
      productFilter: "",
      from: "",
      to: "",
    });
  });

  it("recupera los filtros existentes en la URL", () => {
    const url =
      "/?page=4&severity=HIGH&product=linux" + "&from=2026-10-01&to=2026-10-24";

    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper(url),
    });

    expect(result.current.filters).toEqual({
      page: 4,
      cveId: "",
      severity: "HIGH",
      productFilter: "linux",
      from: "2026-10-01",
      to: "2026-10-24",
    });
  });

  it("normaliza números de página inválidos", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper("/?page=-5"),
    });

    expect(result.current.filters.page).toBe(1);
  });

  it("busca por CVE ID eliminando los filtros anteriores", () => {
    const url =
      "/?page=4&severity=MEDIUM&product=linux" +
      "&from=2026-10-20&to=2026-10-26";

    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper(url),
    });

    act(() => {
      result.current.filterProps.onSearchChange(" CVE-2026-97785 ");
    });

    act(() => {
      result.current.filterProps.onSearch();
    });

    expect(result.current.filters).toEqual({
      page: 1,
      cveId: "CVE-2026-97785",
      severity: "",
      productFilter: "",
      from: "",
      to: "",
    });

    expect(result.current.filterProps.product).toBe("");
    expect(result.current.dateError).toBe("");
  });

  it("permite combinar producto y fechas sin CVE ID", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper("/?severity=HIGH"),
    });

    act(() => {
      result.current.filterProps.onProductChange("linux");

      result.current.filterProps.onFromChange("2026-10-01");

      result.current.filterProps.onToChange("2026-10-24");
    });

    act(() => {
      result.current.filterProps.onSearch();
    });

    expect(result.current.filters).toMatchObject({
      page: 1,
      cveId: "",
      severity: "HIGH",
      productFilter: "linux",
      from: "2026-10-01",
      to: "2026-10-24",
    });
  });

  it("permite buscar una CVE aunque hubiera fechas inválidas", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.filterProps.onSearchChange("CVE-2026-97785");

      result.current.filterProps.onFromChange("2026-02-31");
    });

    act(() => {
      result.current.filterProps.onSearch();
    });

    expect(result.current.filters.cveId).toBe("CVE-2026-97785");

    expect(result.current.filters.from).toBe("");
    expect(result.current.dateError).toBe("");
  });

  it("elimina el CVE ID al seleccionar una severidad", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper("/?cveId=CVE-2026-97785"),
    });

    act(() => {
      result.current.filterProps.onSeverityChange("HIGH");
    });

    expect(result.current.filters).toMatchObject({
      page: 1,
      cveId: "",
      severity: "HIGH",
    });

    expect(result.current.filterProps.search).toBe("");
  });

  it("rechaza fechas inexistentes sin aplicar la búsqueda", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.filterProps.onFromChange("2026-02-31");
    });

    act(() => {
      result.current.filterProps.onSearch();
    });

    expect(result.current.dateError).toBe("Introduce fechas válidas.");

    expect(result.current.filters.from).toBe("");
  });

  it("rechaza un rango de fechas invertido", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.filterProps.onFromChange("2026-10-25");

      result.current.filterProps.onToChange("2026-10-01");
    });

    act(() => {
      result.current.filterProps.onSearch();
    });

    expect(result.current.dateError).toBe(
      "La fecha inicial no puede ser posterior a la final.",
    );

    expect(result.current.filters.from).toBe("");
    expect(result.current.filters.to).toBe("");
  });

  it("cambia la severidad y reinicia la paginación", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper("/?page=4"),
    });

    act(() => {
      result.current.filterProps.onSeverityChange("HIGH");
    });

    expect(result.current.filters.severity).toBe("HIGH");
    expect(result.current.filters.page).toBe(1);
  });

  it("permite avanzar y retroceder de página", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper("/?page=3"),
    });

    act(() => {
      result.current.onNext();
    });

    expect(result.current.filters.page).toBe(4);

    act(() => {
      result.current.onPrevious();
    });

    expect(result.current.filters.page).toBe(3);
  });

  it("conserva los filtros cuando cambia de página", () => {
    const url = "/?page=2&severity=CRITICAL" + "&from=2026-10-01&to=2026-10-24";

    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper(url),
    });

    act(() => {
      result.current.onNext();
    });

    expect(result.current.filters).toMatchObject({
      page: 3,
      severity: "CRITICAL",
      from: "2026-10-01",
      to: "2026-10-24",
    });
  });

  it("limpia todos los filtros", () => {
    const { result } = renderHook(() => useCveFilters(), {
      wrapper: createWrapper("/?page=5&severity=HIGH&product=linux"),
    });

    act(() => {
      result.current.filterProps.onClear();
    });

    expect(result.current.filters).toEqual({
      page: 1,
      cveId: "",
      severity: "",
      productFilter: "",
      from: "",
      to: "",
    });
  });
});
