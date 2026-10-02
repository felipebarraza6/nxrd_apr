import { describe, expect, it } from "vitest";
import { normalizePathname } from "./pathname";

describe("normalizePathname", () => {
  it("quita la barra final", () => {
    expect(normalizePathname("/readings/pos/")).toBe("/readings/pos");
    expect(normalizePathname("/readings/pos//")).toBe("/readings/pos");
  });

  it("deja igual las rutas sin barra final", () => {
    expect(normalizePathname("/readings/pos")).toBe("/readings/pos");
    expect(normalizePathname("/dashboard")).toBe("/dashboard");
  });

  it("mantiene la raíz y tolera vacíos", () => {
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("")).toBe("/");
    expect(normalizePathname(null)).toBe("/");
    expect(normalizePathname(undefined)).toBe("/");
  });

  it("ignora query y hash", () => {
    expect(normalizePathname("/login/?next=/x")).toBe("/login");
    expect(normalizePathname("/help/#faq")).toBe("/help");
  });
});
