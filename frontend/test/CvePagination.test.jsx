import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import CvePagination from "@/components/CvePagination";

const renderPagination = (page, totalPages) => {
  const onPrevious = vi.fn();
  const onNext = vi.fn();

  render(
    <CvePagination
      page={page}
      pagination={{
        page,
        totalPages,
        total: totalPages * 5,
      }}
      onPrevious={onPrevious}
      onNext={onNext}
    />,
  );

  return { onPrevious, onNext };
};

describe("CvePagination", () => {
  it("no muestra paginación si no hay datos", () => {
    const { container } = render(
      <CvePagination
        page={1}
        pagination={null}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("no muestra paginación cuando hay cero páginas", () => {
    const { container } = render(
      <CvePagination
        page={1}
        pagination={{
          page: 1,
          totalPages: 0,
          total: 0,
        }}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("deshabilita Anterior en la primera página", () => {
    renderPagination(1, 5);

    expect(screen.getByText("Página 1 de 5")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();

    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();
  });

  it("deshabilita Siguiente en la última página", () => {
    renderPagination(5, 5);

    expect(screen.getByText("Página 5 de 5")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();

    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
  });

  it("ejecuta los eventos al pulsar los botones", () => {
    const { onPrevious, onNext } = renderPagination(3, 5);

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });
});
