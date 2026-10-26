import { describe, expect, it } from "vitest";

import { formatDate, parseDate, isValidDate } from "@/utils/dateUtils";

describe("formatDate", () => {
  it("convierte YYYY-MM-DD a DD/MM/AAAA", () => {
    expect(formatDate("2026-10-25")).toBe("25/10/2026");
  });

  it("devuelve una cadena vacía si no hay fecha", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate(null)).toBe("");
  });

  it("mantiene el valor cuando no tiene formato ISO", () => {
    expect(formatDate("25/10/2026")).toBe("25/10/2026");
  });
});

describe("parseDate", () => {
  it("convierte DD/MM/AAAA a YYYY-MM-DD", () => {
    expect(parseDate("01/10/2026")).toBe("2026-10-01");
  });

  it("rechaza fechas con formato incorrecto", () => {
    expect(parseDate("1/10/2026")).toBeNull();
    expect(parseDate("2026-10-01")).toBeNull();
    expect(parseDate("texto")).toBeNull();
  });

  it("convierte el formato aunque la fecha no exista", () => {
    expect(parseDate("31/02/2026")).toBe("2026-02-31");
  });
});

describe("isValidDate", () => {
  it("acepta una fecha válida", () => {
    expect(isValidDate("2026-10-25")).toBe(true);
  });

  it("acepta el 29 de febrero de un año bisiesto", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
  });

  it("rechaza el 29 de febrero de un año no bisiesto", () => {
    expect(isValidDate("2026-02-29")).toBe(false);
  });

  it("rechaza días inexistentes", () => {
    expect(isValidDate("2026-02-31")).toBe(false);
    expect(isValidDate("2026-04-31")).toBe(false);
  });

  it("rechaza meses inexistentes", () => {
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("2026-00-01")).toBe(false);
  });

  it("rechaza formatos incorrectos", () => {
    expect(isValidDate("25/10/2026")).toBe(false);
    expect(isValidDate("2026-1-1")).toBe(false);
    expect(isValidDate("")).toBe(false);
  });
});
