import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import CveTable from "@/components/CveTable";

const mockCves = [
  {
    cve_id: "CVE-2026-1234",
    description_en: "Example Linux vulnerability",
    description_es: "Vulnerabilidad de ejemplo",
    score: 9.8,
    severity: "CRITICAL",
    published_at: "2026-10-01T10:00:00.000Z",
    products_summary: "linux_kernel",
  },
  {
    cve_id: "CVE-2026-5678",
    description_en: "Another vulnerability",
    description_es: null,
    score: 7.5,
    severity: "HIGH",
    published_at: "2026-10-02T12:00:00.000Z",
    products_summary: "example_product",
  },
];

const renderTable = (cves = mockCves) => {
  return render(
    <MemoryRouter>
      <CveTable cves={cves} />
    </MemoryRouter>,
  );
};

function DetailProbe() {
  const location = useLocation();

  return (
    <div>
      <p>Vista de detalle</p>
      <output data-testid="return-to">{location.state?.returnTo ?? ""}</output>
    </div>
  );
}

describe("CveTable", () => {
  it("muestra un mensaje cuando no existen vulnerabilidades", () => {
    renderTable([]);

    expect(
      screen.getByText("No se encontraron vulnerabilidades."),
    ).toBeInTheDocument();

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra las vulnerabilidades en la tabla", () => {
    renderTable();

    const table = screen.getByRole("table");

    expect(
      within(table).getByRole("columnheader", {
        name: "CVE ID",
      }),
    ).toBeInTheDocument();

    expect(
      within(table).getByRole("columnheader", {
        name: "Severidad",
      }),
    ).toBeInTheDocument();

    expect(within(table).getByText("CVE-2026-1234")).toBeInTheDocument();

    expect(within(table).getByText("CVE-2026-5678")).toBeInTheDocument();

    expect(
      within(table).getByText("Example Linux vulnerability"),
    ).toBeInTheDocument();

    expect(within(table).getByText("linux_kernel")).toBeInTheDocument();

    expect(within(table).getByText("9.8")).toBeInTheDocument();

    // Una fila de encabezado y dos registros.
    expect(within(table).getAllByRole("row")).toHaveLength(3);
  });

  it("muestra valores alternativos cuando faltan datos", () => {
    renderTable([
      {
        cve_id: "CVE-2026-0001",
        description_en: null,
        description_es: null,
        score: null,
        severity: null,
        published_at: null,
        products_summary: null,
      },
    ]);

    const table = screen.getByRole("table");

    expect(within(table).getByText("Sin descripción")).toBeInTheDocument();

    expect(within(table).getByText("Sin severidad")).toBeInTheDocument();

    expect(within(table).getAllByText("N/D")).toHaveLength(3);
  });

  it("genera enlaces correctos hacia los detalles", () => {
    renderTable();

    // La interfaz incluye enlaces para móvil y escritorio.
    const links = screen.getAllByRole("link", {
      name: "CVE-2026-1234",
    });

    expect(links).toHaveLength(2);

    for (const link of links) {
      expect(link).toHaveAttribute("href", "/cves/CVE-2026-1234");
    }

    expect(
      screen.getAllByRole("link", {
        name: /Ver detalle/,
      }),
    ).toHaveLength(2);
  });

  it("conserva filtros y paginación al entrar en el detalle", () => {
    const originalUrl =
      "/?page=3&severity=HIGH" + "&from=2026-10-01&to=2026-10-24";

    render(
      <MemoryRouter initialEntries={[originalUrl]}>
        <Routes>
          <Route path="/" element={<CveTable cves={mockCves} />} />

          <Route path="/cves/:cveId" element={<DetailProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const table = screen.getByRole("table");

    fireEvent.click(
      within(table).getByRole("link", {
        name: "CVE-2026-1234",
      }),
    );

    expect(screen.getByText("Vista de detalle")).toBeInTheDocument();

    expect(screen.getByTestId("return-to")).toHaveTextContent(originalUrl);
  });
});
