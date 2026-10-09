import { describe, expect, it } from "vitest";
import { WATER_SHADERS } from "@/components/water/shaders";
import { clampUnit, DEFAULT_PALETTE, hexToUnit, mergePalette } from "@/components/water/palette";

describe("paleta del caudal", () => {
  it("convierte hex corto y largo a 0–1", () => {
    expect(hexToUnit("#fff")).toEqual([1, 1, 1]);
    expect(hexToUnit("#3834ff")[0]).toBeCloseTo(56 / 255);
    expect(hexToUnit("#3834ff")[2]).toBe(1);
  });

  it("rechaza un hex que no es color", () => {
    expect(() => hexToUnit("azul")).toThrow(/hex/);
  });

  it("acota la intensidad y completa la paleta parcial", () => {
    expect(clampUnit(4)).toBe(1);
    expect(clampUnit(-1)).toBe(0);
    expect(clampUnit(Number.NaN)).toBe(0);
    expect(mergePalette({ accent: [0, 0, 1] }).deep).toEqual(DEFAULT_PALETTE.deep);
    expect(mergePalette({ accent: [0, 0, 1] }).accent).toEqual([0, 0, 1]);
  });
});

describe("shader portable", () => {
  it("indexa las ondas con constantes, no con el índice del for", () => {
    expect(WATER_SHADERS.frag).toContain("u_rip[0]");
    expect(WATER_SHADERS.frag).toContain("u_rip[23]");
    expect(WATER_SHADERS.frag).not.toContain("u_rip[i]");
  });

  it("toma los colores por uniform para poder retintar sin reescribir el GLSL", () => {
    for (const name of ["u_deep", "u_mid", "u_accent", "u_paper"]) {
      expect(WATER_SHADERS.frag).toContain(`uniform vec3 ${name}`);
    }
  });
});
