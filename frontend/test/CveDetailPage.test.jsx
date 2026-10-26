import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, fireEvent, render, screen } from "@testing-library/react";

import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import CveDetailPage from "@/pages/CveDetailPage";
import { getCveById } from "@/services/cveService";

vi.mock("@/services/cveService", () => ({
  getCveById: vi.fn(),
}));

const mockCve = {
  cve_id: "CVE-2026-1234",
  description_es: "Vulnerabilidad de ejemplo",
  description_en: "Example vulnerability",
  published_at: "2026-10-01T10:00:00.000Z",
  last_modified_at: "2026-10-24T12:00:00.000Z",

  metrics: [
    {
      version: "3.1",
      score: 9.8,
      severity: "CRITICAL",
      vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N",
    },
  ],

  products: [
    {
      id: 1,
      vendor: "Microsoft",
      product: "Windows",
      package_name: "windows_package",
      versions: [
        {
          version: "10",
          less_than: "11",
        },
      ],
    },
  ],

  references: [
    {
      url: "https://nvd.nist.gov/vuln/detail/CVE-2026-1234",
    },
  ],
};

function LocationProbe() {
  const location = useLocation();

  return (
    <p data-testid="current-location">{location.pathname + location.search}</p>
  );
}

const renderDetail = ({ cveId = "CVE-2026-1234", returnTo } = {}) => {
  const entry = {
    pathname: `/cves/${cveId}`,
    state: returnTo ? { returnTo } : null,
  };

  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/" element={<LocationProbe />} />

        <Route path="/cves/:cveId" element={<CveDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

const deferred = () => {
  let resolve;

  const promise = new Promise((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("CveDetailPage", () => {
  it("muestra el estado de carga mientras espera al backend", async () => {
    const pending = deferred();

    getCveById.mockReturnValue(pending.promise);

    renderDetail();

    expect(screen.getByText("Cargando vulnerabilidad...")).toBeInTheDocument();

    await act(async () => {
      pending.resolve(mockCve);
    });

    expect(
      screen.getByRole("heading", {
        name: "CVE-2026-1234",
      }),
    ).toBeInTheDocument();
  });

  it("consulta la vulnerabilidad utilizando el ID de la URL", async () => {
    getCveById.mockResolvedValue({
      ...mockCve,
      cve_id: "CVE-2026-5678",
    });

    renderDetail({
      cveId: "CVE-2026-5678",
    });

    await screen.findByRole("heading", {
      name: "CVE-2026-5678",
    });

    expect(getCveById).toHaveBeenCalledOnce();

    expect(getCveById).toHaveBeenCalledWith("CVE-2026-5678");
  });

  it("muestra la información completa de la vulnerabilidad", async () => {
    getCveById.mockResolvedValue(mockCve);

    renderDetail();

    await screen.findByRole("heading", {
      name: "CVE-2026-1234",
    });

    expect(screen.getByText("Vulnerabilidad de ejemplo")).toBeInTheDocument();

    expect(screen.getByText("Publicado")).toBeInTheDocument();

    expect(screen.getByText("Última modificación")).toBeInTheDocument();

    expect(screen.getByText("Puntuación: 9.8")).toBeInTheDocument();

    expect(screen.getByText("Severidad: CRITICAL")).toBeInTheDocument();

    expect(screen.getByText("Proveedor: Microsoft")).toBeInTheDocument();

    expect(screen.getByText("Producto: Windows")).toBeInTheDocument();

    expect(screen.getByText("10 - anterior a 11")).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: mockCve.references[0].url,
      }),
    ).toHaveAttribute("href", mockCve.references[0].url);
  });

  it("muestra la descripción inglesa si no existe traducción", async () => {
    getCveById.mockResolvedValue({
      ...mockCve,
      description_es: null,
    });

    renderDetail();

    expect(
      await screen.findByText("Example vulnerability"),
    ).toBeInTheDocument();
  });

  it("muestra valores alternativos cuando faltan datos", async () => {
    getCveById.mockResolvedValue({
      ...mockCve,
      description_es: null,
      description_en: null,
      published_at: null,
      last_modified_at: null,
      metrics: [],
      products: [],
      references: [],
    });

    renderDetail();

    expect(await screen.findByText("Sin descripción")).toBeInTheDocument();

    expect(screen.getAllByText("N/D")).toHaveLength(2);

    expect(
      screen.getByText("No hay métricas disponibles."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("No hay productos disponibles."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("No hay referencias disponibles."),
    ).toBeInTheDocument();
  });

  it("muestra un error cuando falla la consulta al backend", async () => {
    getCveById.mockRejectedValue(new Error("Backend no disponible"));

    renderDetail();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Error: Backend no disponible",
    );

    expect(
      screen.queryByRole("heading", {
        name: "CVE-2026-1234",
      }),
    ).not.toBeInTheDocument();
  });

  it("informa cuando la vulnerabilidad no existe", async () => {
    getCveById.mockResolvedValue(null);

    renderDetail();

    expect(
      await screen.findByText("No se encontró la vulnerabilidad."),
    ).toBeInTheDocument();
  });

  it("permite volver al listado conservando filtros y página", async () => {
    getCveById.mockResolvedValue(mockCve);

    const returnTo =
      "/?page=3&severity=HIGH" + "&from=2026-10-01&to=2026-10-24";

    renderDetail({ returnTo });

    await screen.findByRole("heading", {
      name: "CVE-2026-1234",
    });

    const backLink = screen.getByRole("link", {
      name: "Volver a vulnerabilidades",
    });

    expect(backLink).toHaveAttribute("href", returnTo);

    fireEvent.click(backLink);

    expect(screen.getByTestId("current-location")).toHaveTextContent(returnTo);
  });
});
