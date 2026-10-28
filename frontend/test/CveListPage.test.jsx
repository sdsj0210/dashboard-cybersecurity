import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import CveListPage from "@/pages/CveListPage";
import { getCves } from "@/services/cveService";

vi.mock("@/services/cveService", () => ({
  getCves: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("CveListPage", () => {
  it("oculta resultados anteriores cuando las fechas son inválidas", async () => {
    getCves.mockResolvedValue({
      data: [
        {
          cve_id: "CVE-2026-1234",
          description_en: "Vulnerabilidad de ejemplo",
          score: 9.8,
          severity: "CRITICAL",
          products_summary: "Linux",
        },
      ],
      pagination: {
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
      },
    });

    render(
      <MemoryRouter>
        <CveListPage />
      </MemoryRouter>,
    );

    // Comprobar que inicialmente aparecen resultados.
    expect(
      await screen.findByText("Vulnerabilidades encontradas: 1"),
    ).toBeInTheDocument();

    expect(screen.getByRole("table")).toBeInTheDocument();

    // Introducir una fecha inexistente.
    fireEvent.change(screen.getByLabelText("Desde"), {
      target: {
        value: "31/02/2026",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Buscar",
      }),
    );

    // Comprobar que aparece el aviso.
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Introduce fechas válidas.",
    );

    // La tabla y el contador deben desaparecer.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    expect(
      screen.queryByText("Vulnerabilidades encontradas: 1"),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Corrige las fechas para mostrar los resultados."),
    ).toBeInTheDocument();

    // No debe consultar el backend con fechas inválidas.
    expect(getCves).toHaveBeenCalledTimes(1);

    // Corregir la fecha.
    fireEvent.change(screen.getByLabelText("Desde"), {
      target: {
        value: "01/02/2026",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Buscar",
      }),
    );

    // Debe realizar una nueva consulta.
    await waitFor(() => {
      expect(getCves).toHaveBeenCalledTimes(2);
    });

    // Los resultados vuelven a mostrarse.
    expect(
      await screen.findByText("Vulnerabilidades encontradas: 1"),
    ).toBeInTheDocument();

    expect(screen.getByRole("table")).toBeInTheDocument();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
