import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api/client";
import {
  createBillingRun,
  createTariff,
  fetchMeters,
  importReadingsCsv,
  emitBillingRunDtes,
} from "@/lib/api/water";

const mockedFetch = vi.mocked(apiFetch);

describe("water API client", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("fetchMeters envía search y status como query", async () => {
    mockedFetch.mockResolvedValueOnce({ results: [] });
    await fetchMeters({ search: "M-01", status: "ACTIVE", sector: "Norte" });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    const [path] = mockedFetch.mock.calls[0];
    expect(path).toContain("/water/meters/?");
    expect(path).toContain("search=M-01");
    expect(path).toContain("status=ACTIVE");
    expect(path).toContain("sector=Norte");
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

  it("createTariff usa fixed_charge/blocks water (no inventory Tariff)", async () => {
    mockedFetch.mockResolvedValueOnce({
      id: "t1",
      name: "Comunidad",
      fixed_charge: 3500,
      effective_from: "2026-01-01",
      blocks: [],
    });
    await createTariff({
      name: "Comunidad",
      fixed_charge: 3500,
      effective_from: "2026-01-01",
      blocks: [{ from_m3: 0, to_m3: 15, price_per_m3: 400 }],
    });
    const [, opts] = mockedFetch.mock.calls[0];
    expect(opts?.body).toMatchObject({
      name: "Comunidad",
      fixed_charge: 3500,
      blocks: [{ from_m3: 0, to_m3: 15, price_per_m3: 400 }],
    });
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

  it("emitBillingRunDtes llama emit-dtes", async () => {
    mockedFetch.mockResolvedValueOnce({ emitted: [], failed: [], skipped: [] });
    await emitBillingRunDtes("run-uuid");
    expect(mockedFetch).toHaveBeenCalledWith("/water/billing-runs/run-uuid/emit-dtes/", {
      method: "POST",
    });
  });
});
