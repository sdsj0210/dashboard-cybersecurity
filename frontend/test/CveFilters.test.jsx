import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import CveFilters from "@/components/CveFilters";

const renderFilters = (overrides = {}) => {
  const props = {
    search: "",
    product: "",
    severity: "",
    from: "",
    to: "",
    onSearchChange: vi.fn(),
    onProductChange: vi.fn(),
    onSeverityChange: vi.fn(),
    onFromChange: vi.fn(),
    onToChange: vi.fn(),
    onSearch: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };

  render(<CveFilters {...props} />);

  return props;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CveFilters", () => {
  it("muestra los campos y botones del formulario", () => {
    renderFilters();

    expect(
      screen.getByPlaceholderText("Buscar por CVE ID"),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Buscar por producto"),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Desde")).toBeInTheDocument();

    expect(screen.getByLabelText("Hasta")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
  });

  it("muestra los filtros recibidos inicialmente", () => {
    renderFilters({
      search: "CVE-2026-1234",
      product: "linux",
      severity: "HIGH",
      from: "2026-10-01",
      to: "2026-10-24",
    });

    expect(screen.getByPlaceholderText("Buscar por CVE ID")).toHaveValue(
      "CVE-2026-1234",
    );

    expect(screen.getByPlaceholderText("Buscar por producto")).toHaveValue(
      "linux",
    );

    expect(screen.getByLabelText("Desde")).toHaveValue("01/10/2026");

    expect(screen.getByLabelText("Hasta")).toHaveValue("24/10/2026");
  });

  it("notifica cuando cambia el identificador CVE", () => {
    const props = renderFilters();

    fireEvent.change(screen.getByPlaceholderText("Buscar por CVE ID"), {
      target: {
        value: "CVE-2026-1234",
      },
    });

    expect(props.onSearchChange).toHaveBeenCalledWith("CVE-2026-1234");
  });

  it("notifica cuando cambia el producto", () => {
    const props = renderFilters();

    fireEvent.change(screen.getByPlaceholderText("Buscar por producto"), {
      target: {
        value: "Microsoft",
      },
    });

    expect(props.onProductChange).toHaveBeenCalledWith("Microsoft");
  });

  it("convierte las fechas escritas al formato ISO", () => {
    const props = renderFilters();

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: {
        value: "01/10/2026",
      },
    });

    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: {
        value: "24/10/2026",
      },
    });

    expect(props.onFromChange).toHaveBeenCalledWith("2026-10-01");

    expect(props.onToChange).toHaveBeenCalledWith("2026-10-24");
  });

  it("conserva una fecha incompleta para su posterior validación", () => {
    const props = renderFilters();

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: {
        value: "01/10",
      },
    });

    expect(props.onFromChange).toHaveBeenCalledWith("01/10");

    expect(screen.getByLabelText("Desde")).toHaveValue("01/10");
  });

  it("actualiza las fechas al seleccionar valores del calendario", () => {
    const props = renderFilters();

    fireEvent.change(screen.getByLabelText("Seleccionar fecha desde"), {
      target: {
        value: "2026-10-01",
      },
    });

    fireEvent.change(screen.getByLabelText("Seleccionar fecha hasta"), {
      target: {
        value: "2026-10-24",
      },
    });

    expect(props.onFromChange).toHaveBeenCalledWith("2026-10-01");

    expect(props.onToChange).toHaveBeenCalledWith("2026-10-24");

    expect(screen.getByLabelText("Desde")).toHaveValue("01/10/2026");

    expect(screen.getByLabelText("Hasta")).toHaveValue("24/10/2026");
  });

  it("ejecuta la búsqueda cuando se pulsa Buscar", () => {
    const props = renderFilters();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Buscar",
      }),
    );

    expect(props.onSearch).toHaveBeenCalledOnce();
  });

  it("limpia las fechas y ejecuta el evento Limpiar", () => {
    const props = renderFilters({
      from: "2026-10-01",
      to: "2026-10-24",
    });

    expect(screen.getByLabelText("Desde")).toHaveValue("01/10/2026");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Limpiar",
      }),
    );

    expect(props.onClear).toHaveBeenCalledOnce();

    expect(screen.getByLabelText("Desde")).toHaveValue("");

    expect(screen.getByLabelText("Hasta")).toHaveValue("");
  });
});
