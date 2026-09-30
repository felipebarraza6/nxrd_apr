/**
 * Cliente API de agua potable rural: medidores, lecturas, tarifarios y
 * corridas de cobro (backend apps/water).
 */

import { apiFetch, apiFile } from "./client";

// ── Tipos ─────────────────────────────────────────────────────────────────────

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
  last_reading: {
    period: string;
    current_reading: number | string;
    consumed_m3: number | string;
  } | null;
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

export interface CsvImportResult {
  created: Array<{ row: number; meter: string; period: string; consumed_m3: string }>;
  errors: Array<{ row: number; error: string }>;
  skipped: Array<{ row: number; meter?: string; reason: string }>;
}

// ── Medidores ─────────────────────────────────────────────────────────────────

export async function fetchMeters(
  filters: { search?: string; status?: string } = {},
): Promise<WaterMeter[]> {
  const qs = new URLSearchParams();
  if (filters.search) qs.set("search", filters.search);
  if (filters.status) qs.set("status", filters.status);
  qs.set("page_size", "500");
  const data = await apiFetch<{ results?: WaterMeter[] } | WaterMeter[]>(
    `/water/meters/?${qs.toString()}`,
  );
  return Array.isArray(data) ? data : (data.results ?? []);
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

// ── Lecturas ──────────────────────────────────────────────────────────────────

export async function fetchReadings(
  filters: { meter?: string; period?: string } = {},
): Promise<WaterReading[]> {
  const qs = new URLSearchParams();
  if (filters.meter) qs.set("meter", filters.meter);
  if (filters.period) qs.set("period", filters.period);
  qs.set("page_size", "500");
  const data = await apiFetch<{ results?: WaterReading[] } | WaterReading[]>(
    `/water/readings/?${qs.toString()}`,
  );
  return Array.isArray(data) ? data : (data.results ?? []);
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
    "/water/tariffs/",
  );
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function createTariff(payload: {
  name: string;
  fixed_charge: number | string;
  effective_from: string;
  blocks: Array<{ from_m3: number | string; to_m3: number | string | null; price_per_m3: number | string }>;
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

// ── Corridas de cobro ─────────────────────────────────────────────────────────

export async function fetchBillingRuns(): Promise<BillingRunRow[]> {
  const data = await apiFetch<BillingRunRow[] | { results?: BillingRunRow[] }>(
    "/water/billing-runs/",
  );
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function createBillingRun(period: string): Promise<BillingRunRow> {
  return apiFetch<BillingRunRow>("/water/billing-runs/", {
    method: "POST",
    body: { period },
  });
}

export interface DteEmitResult {
  emitted: Array<{ meter: string; folio: string | null }>;
  failed: Array<{ meter: string; error: string }>;
  skipped: Array<{ meter: string; reason: string }>;
}

export async function emitBillingRunDtes(runId: string): Promise<DteEmitResult> {
  return apiFetch<DteEmitResult>(`/water/billing-runs/${runId}/emit-dtes/`, {
    method: "POST",
  });
}

// ── Descarga plantilla CSV ────────────────────────────────────────────────────

export function readingsCsvTemplate(): Blob {
  const csv =
    "meter_number,period,current_reading\nM-001,2026-09,125.5\nM-002,2026-09,80\n";
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
