/**
 * Cliente API de agua potable rural — tests contra el contrato production.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api/client";
import {
  createBillingRun,
  createTariff,
  fetchBillingRuns,
  fetchMeters,
  fetchReadings,
  importReadingsCsv,
  emitBillingRunDtes,
} from "@/lib/api/water";

const mockedFetch = vi.mocked(apiFetch);

describe("water API client", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("fetchMeters envía search, status, sector y client como query", async () => {
    mockedFetch.mockResolvedValueOnce({ results: [] });
    await fetchMeters({
      search: "M-01",
      status: "ACTIVE",
      sector: "Norte",
      client: 42,
    });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    const [path] = mockedFetch.mock.calls[0];
    expect(path).toContain("/water/meters/?");
    expect(path).toContain("search=M-01");
    expect(path).toContain("status=ACTIVE");
    expect(path).toContain("sector=Norte");
    expect(path).toContain("client=42");
  });

  it("fetchReadings envía meter, period, source y search", async () => {
    mockedFetch.mockResolvedValueOnce({ results: [] });
    await fetchReadings({
      meter: "m-uuid",
      period: "2026-09",
      source: "CSV",
      search: "Juan",
    });
    const [path] = mockedFetch.mock.calls[0];
    expect(path).toContain("/water/readings/?");
    expect(path).toContain("meter=m-uuid");
    expect(path).toContain("period=2026-09");
    expect(path).toContain("source=CSV");
    expect(path).toContain("search=Juan");
  });

  it("fetchBillingRuns pide array plano sin page_size", async () => {
    mockedFetch.mockResolvedValueOnce([
      {
        id: "run-1",
        period: "2026-09",
        tariff_name: "Básico",
        status: "DONE",
        orders_created: 1,
        total_amount: "1000",
        items: [],
      },
    ]);
    const runs = await fetchBillingRuns();
    expect(mockedFetch).toHaveBeenCalledWith("/water/billing-runs/");
    const [path] = mockedFetch.mock.calls[0];
    expect(path).not.toContain("page_size");
    expect(runs).toHaveLength(1);
    expect(runs[0].period).toBe("2026-09");
  });

  it("createBillingRun envía period y tariff opcional (BillingRunCreateSerializer)", async () => {
    mockedFetch.mockResolvedValueOnce({
      id: "run-1",
      period: "2026-09",
      tariff_name: "Básico",
      status: "DONE",
      orders_created: 1,
      total_amount: "1000",
      items: [],
      skipped: [],
    });
    await createBillingRun({ period: "2026-09", tariff: "tariff-uuid" });
    expect(mockedFetch).toHaveBeenCalledWith("/water/billing-runs/", {
      method: "POST",
      body: { period: "2026-09", tariff: "tariff-uuid" },
    });
  });

  it("createBillingRun(string) es atajo solo con period", async () => {
    mockedFetch.mockResolvedValueOnce({
      id: "run-2",
      period: "2026-10",
      tariff_name: "Básico",
      status: "DONE",
      orders_created: 0,
      total_amount: "0",
      items: [],
    });
    await createBillingRun("2026-10");
    expect(mockedFetch).toHaveBeenCalledWith("/water/billing-runs/", {
      method: "POST",
      body: { period: "2026-10" },
    });
  });

  it("createTariff NO envía blocks (read-only en TariffSerializer)", async () => {
    mockedFetch.mockResolvedValueOnce({
      id: "t1",
      name: "Comunidad",
      fixed_charge: "3500",
      effective_from: "2026-01-01",
      blocks: [],
    });
    await createTariff({
      name: "Comunidad",
      fixed_charge: 3500,
      effective_from: "2026-01-01",
    });
    const [, opts] = mockedFetch.mock.calls[0];
    expect(opts?.body).toEqual({
      name: "Comunidad",
      fixed_charge: 3500,
      effective_from: "2026-01-01",
    });
    expect(opts?.body).not.toHaveProperty("blocks");
    expect(opts?.body).not.toHaveProperty("fixed_tariff");
    expect(opts?.body).not.toHaveProperty("product");
  });

  it("importReadingsCsv manda FormData a import-csv", async () => {
    mockedFetch.mockResolvedValueOnce({ created: [], errors: [], skipped: [] });
    const file = new File(["meter_number,period,current_reading\n"], "lecturas.csv", {
      type: "text/csv",
    });
    await importReadingsCsv(file, "2026-09");
    const [path, opts] = mockedFetch.mock.calls[0];
    expect(path).toBe("/water/readings/import-csv/");
    expect(opts?.method).toBe("POST");
    expect(opts?.body).toBeInstanceOf(FormData);
    const form = opts?.body as FormData;
    expect(form.get("file")).toBeTruthy();
    expect(form.get("period_default")).toBe("2026-09");
  });

  it("emitBillingRunDtes llama emit-dtes sin body", async () => {
    mockedFetch.mockResolvedValueOnce({ emitted: [], failed: [], skipped: [] });
    await emitBillingRunDtes("run-uuid");
    expect(mockedFetch).toHaveBeenCalledWith("/water/billing-runs/run-uuid/emit-dtes/", {
      method: "POST",
    });
  });
});
