/**
 * Cliente API de agua potable rural (apps/water en yggdra_infra).
 *
 * Tipos escritos a mano a partir de los serializers reales de
 * `api/apps/water/` en las ramas `production`/`dev` del backend:
 *   - MeterSerializer.last_reading → { period, current_reading, consumed_m3 } | null
 *   - TariffSerializer → name, fixed_charge, effective_from, blocks[{from_m3,to_m3,price_per_m3}]
 *   - BillingRunCreateSerializer → { period: "YYYY-MM", tariff?: uuid }
 *
 * NO usar components["schemas"]["Tariff"|"Meter"] del OpenAPI generado en este
 * repo: el freeze confunde Tariff con el tarifario de inventario (product /
 * fixed_tariff / ranges) y tipa last_reading como string. Water vive en
 * production/dev, no en main — el schema spectacular no refleja estos
 * serializers. Cuando el backend publique un OpenAPI correcto, regenerar
 * con sync-contract y tipar desde ahí.
 */

import { apiFetch } from "./client";

// ── Tipos (serializers water reales) ─────────────────────────────────────────

export interface WaterMeterLastReading {
  period: string;
  current_reading: number | string;
  consumed_m3: number | string;
}

export interface WaterMeter {
  id: string;
  number: string;
  client: number | null;
  client_name: string | null;
  sector: string;
  installed_at: string | null;
  status: "ACTIVE" | "RETIRED" | "DAMAGED";
  initial_reading: number | string;
  readings_count: number;
  last_reading: WaterMeterLastReading | null;
}

export interface WaterReading {
  id: string;
  meter: string;
  meter_number: string;
  client_name: string | null;
  period: string;
  previous_reading: number | string;
  current_reading: number | string;
  consumed_m3: number | string;
  source: "MANUAL" | "CSV";
  read_at: string;
}

export interface WaterTariffBlock {
  id?: string;
  tariff?: string;
  from_m3: number | string;
  to_m3: number | string | null;
  price_per_m3: number | string;
}

export interface WaterTariff {
  id: string;
  name: string;
  fixed_charge: number | string;
  effective_from: string;
  blocks: WaterTariffBlock[];
}

export interface BillingRunItemRow {
  id: string;
  meter_number: string;
  client_name: string | null;
  order: string;
  order_number: string | null;
  order_payment_status: string | null;
  consumed_m3: number | string;
  amount: number | string;
}

export interface BillingRunRow {
  id: string;
  period: string;
  tariff_name: string;
  status: string;
  orders_created: number;
  total_amount: number | string;
  items: BillingRunItemRow[];
  skipped?: Array<{ meter: string; reason: string }>;
}

export interface BillingRunCreatePayload {
  /** Período de cobro YYYY-MM (BillingRunCreateSerializer). */
  period: string;
  /** UUID de tarifario opcional; si se omite, el backend usa el vigente. */
  tariff?: string;
}

export interface CsvImportResult {
  created: Array<{ row: number; meter: string; period: string; consumed_m3: string }>;
  errors: Array<{ row: number; error: string }>;
  skipped: Array<{ row: number; meter?: string; reason: string }>;
}

export interface DteEmitResult {
  emitted: Array<{ meter: string; folio: string | null }>;
  failed: Array<{ meter: string; error: string }>;
  skipped: Array<{ meter: string; reason: string }>;
}

function asList<T>(data: { results?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : (data.results ?? []);
}

// ── Medidores ─────────────────────────────────────────────────────────────────

export interface MeterFilters {
  /** SearchFilter del viewset (número, socio, sector). */
  search?: string;
  status?: "ACTIVE" | "RETIRED" | "DAMAGED" | string;
  sector?: string;
  client?: number | string;
}

export async function fetchMeters(filters: MeterFilters = {}): Promise<WaterMeter[]> {
  const qs = new URLSearchParams();
  if (filters.search) qs.set("search", filters.search);
  if (filters.status) qs.set("status", filters.status);
  if (filters.sector) qs.set("sector", filters.sector);
  if (filters.client != null && filters.client !== "") {
    qs.set("client", String(filters.client));
  }
  qs.set("page_size", "500");
  const data = await apiFetch<{ results?: WaterMeter[] } | WaterMeter[]>(
    `/water/meters/?${qs.toString()}`,
  );
  return asList(data);
}

export async function createMeter(
  payload: Partial<WaterMeter>,
): Promise<WaterMeter> {
  return apiFetch<WaterMeter>("/water/meters/", { method: "POST", body: payload });
}

export async function updateMeter(
  id: string,
  payload: Partial<WaterMeter>,
): Promise<WaterMeter> {
  return apiFetch<WaterMeter>(`/water/meters/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteMeter(id: string): Promise<void> {
  await apiFetch(`/water/meters/${id}/`, { method: "DELETE" });
}

// ── Lecturas ──────────────────────────────────────────────────────────────────

export interface ReadingFilters {
  meter?: string;
  period?: string;
  search?: string;
}

export async function fetchReadings(
  filters: ReadingFilters = {},
): Promise<WaterReading[]> {
  const qs = new URLSearchParams();
  if (filters.meter) qs.set("meter", filters.meter);
  if (filters.period) qs.set("period", filters.period);
  if (filters.search) qs.set("search", filters.search);
  qs.set("page_size", "500");
  const data = await apiFetch<{ results?: WaterReading[] } | WaterReading[]>(
    `/water/readings/?${qs.toString()}`,
  );
  return asList(data);
}

export async function createReading(payload: {
  meter: string;
  period: string;
  current_reading: number | string;
}): Promise<WaterReading> {
  return apiFetch<WaterReading>("/water/readings/", { method: "POST", body: payload });
}

export async function updateReading(
  id: string,
  payload: { current_reading: number | string },
): Promise<WaterReading> {
  return apiFetch<WaterReading>(`/water/readings/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteReading(id: string): Promise<void> {
  await apiFetch(`/water/readings/${id}/`, { method: "DELETE" });
}

/**
 * POST multipart /water/readings/import-csv/
 * Campos: file (CSV meter_number,period,current_reading) y period_default opcional.
 */
export async function importReadingsCsv(
  file: File,
  periodDefault?: string,
): Promise<CsvImportResult> {
  const form = new FormData();
  form.append("file", file);
  if (periodDefault) form.append("period_default", periodDefault);
  return apiFetch<CsvImportResult>("/water/readings/import-csv/", {
    method: "POST",
    body: form,
  });
}

// ── Tarifarios ────────────────────────────────────────────────────────────────

export async function fetchTariffs(): Promise<WaterTariff[]> {
  const data = await apiFetch<{ results?: WaterTariff[] } | WaterTariff[]>(
    "/water/tariffs/?page_size=200",
  );
  return asList(data);
}

export async function createTariff(payload: {
  name: string;
  fixed_charge: number | string;
  effective_from: string;
  blocks: Array<{
    from_m3: number | string;
    to_m3: number | string | null;
    price_per_m3: number | string;
  }>;
}): Promise<WaterTariff> {
  return apiFetch<WaterTariff>("/water/tariffs/", { method: "POST", body: payload });
}

export async function updateTariff(
  id: string,
  payload: Partial<{
    name: string;
    fixed_charge: number | string;
    effective_from: string;
  }>,
): Promise<WaterTariff> {
  return apiFetch<WaterTariff>(`/water/tariffs/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteTariff(id: string): Promise<void> {
  await apiFetch(`/water/tariffs/${id}/`, { method: "DELETE" });
}

// ── Corridas de cobro ─────────────────────────────────────────────────────────

export async function fetchBillingRuns(): Promise<BillingRunRow[]> {
  const data = await apiFetch<BillingRunRow[] | { results?: BillingRunRow[] }>(
    "/water/billing-runs/?page_size=200",
  );
  return asList(data);
}

/** POST /water/billing-runs/ — body BillingRunCreateSerializer. */
export async function createBillingRun(
  periodOrPayload: string | BillingRunCreatePayload,
): Promise<BillingRunRow> {
  const body: BillingRunCreatePayload =
    typeof periodOrPayload === "string"
      ? { period: periodOrPayload }
      : periodOrPayload;
  return apiFetch<BillingRunRow>("/water/billing-runs/", {
    method: "POST",
    body,
  });
}

/** POST /water/billing-runs/{id}/emit-dtes/ — emite boletas SII pendientes. */
export async function emitBillingRunDtes(runId: string): Promise<DteEmitResult> {
  return apiFetch<DteEmitResult>(`/water/billing-runs/${runId}/emit-dtes/`, {
    method: "POST",
  });
}

// ── Plantilla CSV ─────────────────────────────────────────────────────────────

export function readingsCsvTemplate(): Blob {
  const csv =
    "meter_number,period,current_reading\nM-001,2026-09,125.5\nM-002,2026-09,80\n";
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
