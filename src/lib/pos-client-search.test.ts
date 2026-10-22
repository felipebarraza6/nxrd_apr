import { describe, expect, it } from "vitest";
import {
  filterByPosSearch,
  matchPosSearch,
  normalizePhoneDigits,
  normalizeRutDigits,
  normalizeSearchText,
  POS_CLIENT_SEARCH_PLACEHOLDER,
  orderPosSearchResults,
} from "@/lib/pos-client-search";

describe("pos-client-search", () => {
  it("normaliza tildes y mayúsculas", () => {
    expect(normalizeSearchText("  José  Pérez  ")).toBe("jose perez");
    expect(normalizeSearchText("ÑUBLE")).toBe("nuble");
  });

  it("normaliza RUT quitando puntos y guión", () => {
    expect(normalizeRutDigits("12.345.678-9")).toBe("123456789");
  });

  it("normaliza teléfono con +56 y espacios", () => {
    expect(normalizePhoneDigits("+56 9 4000 0039")).toBe("940000039");
    expect(normalizePhoneDigits("9 4000 0039")).toBe("940000039");
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

  it("filtra un listado de medidores por apellido del socio (OCAMPO)", () => {
    const meters = [
      { id: "1", number: "MED-01", client_name: "Juan Pérez", sector: "Alto", address: "Calle 1" },
      { id: "2", number: "MED-18", client_name: "María Ocampo", sector: "Bajo", address: "Los Robles 12" },
      { id: "3", number: "MED-20", client_name: "Ana Soto", sector: "Alto", address: "Pasaje Ocampo" },
    ];
    const byName = filterByPosSearch(meters, "OCAMPO", (m) => ({
      name: m.client_name,
      address: m.address,
      meterNumber: m.number,
      sector: m.sector,
    }));
    expect(byName.map((h) => h.item.id).sort()).toEqual(["2", "3"]);
    expect(byName.find((h) => h.item.id === "2")?.match.field).toBe("name");
    expect(byName.find((h) => h.item.id === "3")?.match.field).toBe("address");
  });
});

describe("orderPosSearchResults", () => {
  const meters = [
    { id: "1", number: "M-001" },
    { id: "2", number: "M-002" },
    { id: "3", number: "M-003" },
  ];
  const read = new Set(["1"]);

  it("incluye medidores ya leídos (al final) en vez de ocultarlos", () => {
    const out = orderPosSearchResults(meters, (m) => read.has(m.id));
    expect(out.map((m) => m.number)).toEqual(["M-002", "M-003", "M-001"]);
  });

  it("si el único resultado ya fue leído, igual se devuelve", () => {
    const out = orderPosSearchResults([meters[0]], (m) => read.has(m.id));
    expect(out.map((m) => m.number)).toEqual(["M-001"]);
  });

  it("respeta el medidor fijado aunque esté leído", () => {
    const out = orderPosSearchResults(meters, (m) => read.has(m.id), "1");
    expect(out[0].number).toBe("M-001");
    expect(out).toHaveLength(3);
  });
});
