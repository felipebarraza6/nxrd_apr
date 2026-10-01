/**
 * Cliente API de agua potable rural (apps/water en yggdra_infra).
 *
 * Fuente de verdad: serializers/views reales de `api/apps/water/*`,
 * `accounts/authentication.py` y `shared/schema_contract.py` en la rama
 * `production` del backend (contrato transcrito). NO usar
 * components["schemas"]["Tariff"|"Meter"] del OpenAPI freeze de este repo:
 * confunde Tariff con el tarifario de inventario y tipa last_reading mal.
 *
 * Gaps de backend a follow-up:
 * - Tariff.blocks es READ-ONLY; no hay endpoint tariff-blocks → la UI no
 *   puede crear/editar tramos vía API.
 * - ViewSets water usan module_name="water_management" (yggdra_infra#39).
 * - Header X-Yggdra-Schema-Sha requiere CORS Access-Control-Expose-Headers
 *   para leerse cross-origin.
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
  /** Read-only; null si no hay socio asignado. */
  client_name: string | null;
  sector: string;
  installed_at: string | null;
  status: "ACTIVE" | "RETIRED" | "DAMAGED";
  initial_reading: number | string;
  /** Read-only. */
  readings_count: number;
  /** Read-only: null | { period, current_reading, consumed_m3 }. */
  last_reading: WaterMeterLastReading | null;
  created?: string;
  modified?: string;
}

export interface WaterReading {
  id: string;
  meter: string;
  /** Read-only. */
  meter_number: string;
  /** Read-only; null si no hay socio. */
  client_name: string | null;
  period: string;
  /** Read-only, calculado en servidor. */
  previous_reading: number | string;
  current_reading: number | string;
  /** Read-only decimal string. */
  consumed_m3: number | string;
  /** Read-only; MANUAL en create. */
  source: "MANUAL" | "CSV";
  /** Read-only. */
  read_by?: string | null;
  /** Read-only. */
  read_at: string;
  created?: string;
}

/**
 * Bloque de tramo nested en Tariff. READ-ONLY en TariffSerializer;
 * no hay endpoint para crear/editar blocks.
 */
export interface WaterTariffBlock {
  id: string;
  tariff: string;
  from_m3: number | string;
  to_m3: number | string | null;
  price_per_m3: number | string;
}

export interface WaterTariff {
  id: string;
  name: string;
  fixed_charge: number | string;
  effective_from: string;
  /** Read-only nested. La UI no debe enviar blocks en create/update. */
  blocks: WaterTariffBlock[];
  created?: string;
  modified?: string;
}

export interface BillingRunItemRow {
  id: string;
  run?: string;
  meter?: string;
  meter_number: string;
  client_name: string | null;
  order: string;
  order_number: string | null;
  order_payment_status: string | null;
  period?: string;
  consumed_m3: number | string;
  amount: number | string;
}

export interface BillingRunRow {
  id: string;
  period: string;
  tariff?: string | null;
  /** Read-only. */
  tariff_name: string;
  /** Read-only. */
  status: string;
  /** Read-only. */
  orders_created: number;
  /** Read-only decimal string. */
  total_amount: number | string;
  /** Read-only nested. */
  items: BillingRunItemRow[];
  created?: string;
  /** Solo en respuesta de create (extra field). */
  skipped?: Array<{ meter: string; reason: string }>;
}

export interface BillingRunCreatePayload {
  /** Período YYYY-MM (^\\d{4}-(0[1-9]|1[0-2])$). */
  period: string;
  /** UUID de tarifario opcional; null/omit → vigente. */
  tariff?: string | null;
}

export interface CsvImportResult {
  created: Array<{ row?: number; meter?: string; period?: string; consumed_m3?: string }>;
  errors: Array<{ row?: number; error: string }>;
  skipped: Array<{ row?: number; meter?: string; reason: string }>;
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
  /** SearchFilter: number, sector, client__name. */
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

export type MeterWritePayload = {
  number: string;
  client?: number | null;
  sector?: string;
  installed_at?: string | null;
  status?: "ACTIVE" | "RETIRED" | "DAMAGED";
  initial_reading?: number | string;
};

export async function createMeter(payload: MeterWritePayload): Promise<WaterMeter> {
  return apiFetch<WaterMeter>("/water/meters/", { method: "POST", body: payload });
}

export async function updateMeter(
  id: string,
  payload: Partial<MeterWritePayload>,
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
  source?: "MANUAL" | "CSV" | string;
  /** SearchFilter: meter__number, meter__client__name. */
  search?: string;
}

export async function fetchReadings(
  filters: ReadingFilters = {},
): Promise<WaterReading[]> {
  const qs = new URLSearchParams();
  if (filters.meter) qs.set("meter", filters.meter);
  if (filters.period) qs.set("period", filters.period);
  if (filters.source) qs.set("source", filters.source);
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
 * Campos: file (CSV UTF-8 header meter_number,period,current_reading)
 * y period_default opcional. → {created, errors, skipped}; 400 {error}.
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

/** Create sin blocks: blocks son read-only en TariffSerializer. */
export async function createTariff(payload: {
  name: string;
  fixed_charge: number | string;
  effective_from: string;
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

/**
 * GET /water/billing-runs/ → array plano (no paginado), orden -period.
 * No enviar page_size.
 */
export async function fetchBillingRuns(): Promise<BillingRunRow[]> {
  const data = await apiFetch<BillingRunRow[]>("/water/billing-runs/");
  return Array.isArray(data) ? data : [];
}

/**
 * POST /water/billing-runs/ — body {period, tariff?}.
 * 201 BillingRun + skipped; 409 {error} en ValueError.
 */
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

/**
 * POST /water/billing-runs/{id}/emit-dtes/ — sin body.
 * → {emitted, failed, skipped}; 404 {error}.
 */
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
