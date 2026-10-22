/**
 * Rango válido al cargar una lectura atrasada.
 *
 * El mínimo es la lectura del período inmediato anterior (o la lectura
 * inicial del medidor). El máximo es la lectura del período inmediato
 * siguiente, si ya existe. `last_reading` del medidor es la última global
 * y no sirve para atrasadas.
 */

export type MeterReadingPoint = {
  period: string;
  current_reading: number | string;
};

export type ReadingNeighbors = {
  min: number;
  max: number | null;
  previousLabel: string;
  nextLabel: string | null;
  previousPeriod: string | null;
  nextPeriod: string | null;
};

const MONTH_NAMES_ES_CL = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export function periodMonthName(period: string): string {
  const month = Number(period.slice(5, 7));
  return MONTH_NAMES_ES_CL[month - 1] ?? period;
}

function formatReadingValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(value);
}

export function readingNeighbors({
  period,
  initialReading,
  readings,
}: {
  period: string;
  initialReading: number | string;
  readings: readonly MeterReadingPoint[];
}): ReadingNeighbors {
  const others = readings
    .filter((row) => row.period !== period)
    .slice()
    .sort((a, b) => a.period.localeCompare(b.period));
  const previous = [...others].reverse().find((row) => row.period < period);
  const next = others.find((row) => row.period > period);
  return {
    min: previous ? Number(previous.current_reading) : Number(initialReading),
    max: next ? Number(next.current_reading) : null,
    previousLabel: previous ? periodMonthName(previous.period) : "lectura inicial",
    nextLabel: next ? periodMonthName(next.period) : null,
    previousPeriod: previous?.period ?? null,
    nextPeriod: next?.period ?? null,
  };
}

export function isReadingInRange(
  value: number,
  neighbors: Pick<ReadingNeighbors, "min" | "max">,
): boolean {
  if (!Number.isFinite(value)) return false;
  if (value < neighbors.min) return false;
  if (neighbors.max != null && value > neighbors.max) return false;
  return true;
}

export function readingRangeMessage(
  neighbors: Pick<ReadingNeighbors, "min" | "max" | "previousLabel" | "nextLabel"> & {
    period: string;
  },
): string {
  const month = periodMonthName(neighbors.period);
  const minText = `${formatReadingValue(neighbors.min)} (${neighbors.previousLabel})`;
  if (neighbors.max != null && neighbors.nextLabel) {
    return `La lectura de ${month} debe estar entre ${minText} y ${formatReadingValue(neighbors.max)} (${neighbors.nextLabel}).`;
  }
  return `La lectura de ${month} debe ser mayor o igual que ${minText}.`;
}
