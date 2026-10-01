import { describe, expect, it } from "vitest";
import {
  filterByPosSearch,
  matchPosSearch,
  normalizeRutDigits,
  normalizeSearchText,
  POS_CLIENT_SEARCH_PLACEHOLDER,
} from "@/lib/pos-client-search";

describe("pos-client-search", () => {
  it("normaliza tildes y mayúsculas", () => {
    expect(normalizeSearchText("  José  Pérez  ")).toBe("jose perez");
    expect(normalizeSearchText("ÑUBLE")).toBe("nuble");
  });

  it("normaliza RUT quitando puntos y guión", () => {
    expect(normalizeRutDigits("12.345.678-9")).toBe("123456789");
  });

  it("encuentra por nombre sin tilde", () => {
    const m = matchPosSearch(
      { name: "María José López", meterNumber: "M-01" },
      "maria jose",
    );
    expect(m?.field).toBe("name");
  });

  it("encuentra por dirección (client-side)", () => {
    const m = matchPosSearch(
      { name: "APR Demo", address: "Camino Los Álamos 123", meterNumber: "M-02" },
      "alamos",
    );
    expect(m?.field).toBe("address");
    expect(m?.value).toContain("Álamos");
  });

  it("encuentra por número de medidor", () => {
    const m = matchPosSearch(
      { name: "Socio", meterNumber: "APR-0042" },
      "0042",
    );
    expect(m?.field).toBe("meter");
  });

  it("encuentra por RUT con o sin formato", () => {
    const item = { name: "Socio", rut: "12.345.678-5", meterNumber: "M-1" };
    expect(matchPosSearch(item, "12345678")?.field).toBe("rut");
    expect(matchPosSearch(item, "12.345.678")?.field).toBe("rut");
  });

  it("prioriza medidor sobre nombre si ambos coinciden", () => {
    const m = matchPosSearch(
      { name: "Sector Norte", meterNumber: "Norte-1", sector: "Norte" },
      "norte",
    );
    expect(m?.field).toBe("meter");
  });

  it("filterByPosSearch omite no coincidentes", () => {
    const rows = [
      { id: 1, name: "Ana", address: "Calle 1", meterNumber: "A-1", rut: null },
      { id: 2, name: "Bruno", address: "Pasaje Sur", meterNumber: "B-2", rut: "11.111.111-1" },
    ];
    const hits = filterByPosSearch(rows, "pasaje", (r) => r);
    expect(hits).toHaveLength(1);
    expect(hits[0].item.id).toBe(2);
    expect(hits[0].match.field).toBe("address");
  });

  it("placeholder estable", () => {
    expect(POS_CLIENT_SEARCH_PLACEHOLDER).toContain("dirección");
  });
});
