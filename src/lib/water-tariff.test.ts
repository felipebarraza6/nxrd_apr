import { describe, expect, it } from "vitest";
import { pickVigenteTariff } from "@/lib/water-tariff";

describe("pickVigenteTariff", () => {
  const tariffs = [
    { id: "future", effective_from: "2026-12-01", blocks: [] as unknown[] },
    { id: "current", effective_from: "2026-03-01", blocks: [{ from_m3: "0" }] },
    { id: "old", effective_from: "2025-01-01", blocks: [] as unknown[] },
  ];

  it("elige el más reciente que ya empezó, no el de fecha futura", () => {
    expect(pickVigenteTariff(tariffs, "2026-10-08")?.id).toBe("current");
  });

  it("devuelve null si todos son futuros", () => {
    expect(pickVigenteTariff(tariffs, "2024-01-01")).toBeNull();
  });
});
