import { describe, expect, it } from "vitest";
import {
  isReadingInRange,
  periodMonthName,
  readingNeighbors,
  readingRangeMessage,
} from "./reading-bounds";

const MED18 = [
  { period: "2026-07", current_reading: 2100 },
  { period: "2026-09", current_reading: 2594 },
];

describe("periodMonthName", () => {
  it("nombra el mes en español chileno en minúsculas", () => {
    expect(periodMonthName("2026-08")).toBe("agosto");
    expect(periodMonthName("2026-09")).toBe("septiembre");
  });
});

describe("readingNeighbors", () => {
  it("usa la lectura inmediata anterior al período, no la última global", () => {
    const n = readingNeighbors({
      period: "2026-08",
      initialReading: 0,
      readings: MED18,
    });
    expect(n.min).toBe(2100);
    expect(n.previousLabel).toBe("julio");
    expect(n.max).toBe(2594);
    expect(n.nextLabel).toBe("septiembre");
  });

  it("acepta una lectura atrasada entre julio y septiembre (MED-18 / 2210)", () => {
    const n = readingNeighbors({
      period: "2026-08",
      initialReading: 0,
      readings: MED18,
    });
    expect(isReadingInRange(2210, n)).toBe(true);
    expect(isReadingInRange(2100, n)).toBe(true);
    expect(isReadingInRange(2594, n)).toBe(true);
    expect(isReadingInRange(2099, n)).toBe(false);
    expect(isReadingInRange(2595, n)).toBe(false);
  });

  it("cae a la lectura inicial si no hay período anterior", () => {
    const n = readingNeighbors({
      period: "2026-08",
      initialReading: 100,
      readings: [{ period: "2026-09", current_reading: 2594 }],
    });
    expect(n.min).toBe(100);
    expect(n.previousLabel).toBe("lectura inicial");
    expect(n.max).toBe(2594);
  });

  it("sin lectura posterior no pone tope máximo", () => {
    const n = readingNeighbors({
      period: "2026-09",
      initialReading: 0,
      readings: [{ period: "2026-08", current_reading: 2210 }],
    });
    expect(n.min).toBe(2210);
    expect(n.max).toBeNull();
    expect(n.nextLabel).toBeNull();
    expect(isReadingInRange(3000, n)).toBe(true);
  });

  it("ignora la lectura del mismo período al editar", () => {
    const n = readingNeighbors({
      period: "2026-08",
      initialReading: 0,
      readings: [
        { period: "2026-07", current_reading: 2100 },
        { period: "2026-08", current_reading: 9999 },
        { period: "2026-09", current_reading: 2594 },
      ],
    });
    expect(n.min).toBe(2100);
    expect(n.max).toBe(2594);
  });
});

describe("readingRangeMessage", () => {
  it("explica el rango con el mes anterior y el siguiente", () => {
    expect(
      readingRangeMessage({
        period: "2026-08",
        min: 2100,
        max: 2594,
        previousLabel: "julio",
        nextLabel: "septiembre",
      }),
    ).toBe(
      "La lectura de agosto debe estar entre 2100 (julio) y 2594 (septiembre).",
    );
  });

  it("explica el mínimo cuando no hay lectura siguiente", () => {
    expect(
      readingRangeMessage({
        period: "2026-08",
        min: 2100,
        max: null,
        previousLabel: "julio",
        nextLabel: null,
      }),
    ).toBe("La lectura de agosto debe ser mayor o igual que 2100 (julio).");
  });
});
