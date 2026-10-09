/** Color 0–1 por canal. El shader no acepta hex. */
export type Rgb = [number, number, number];

export type WaterPalette = {
  /** Fondo casi negro del caudal oscuro. */
  deep: Rgb;
  /** Azul medio de las vetas. */
  mid: Rgb;
  /** #3834ff de Cauce. También tiñe el caudal claro. */
  accent: Rgb;
  /** Papel del caudal claro. #f3f3f3. */
  paper: Rgb;
};

/**
 * Mismos literales que el caudal que ya está en landing y login.
 * No redondear a hex: 0.22 no es 56/255 y el agua se ve distinta.
 */
export const DEFAULT_PALETTE: WaterPalette = {
  deep: [0, 0.008, 0.05],
  mid: [0.012, 0.059, 0.78],
  accent: [0.22, 0.204, 1],
  paper: [0.953, 0.953, 0.953],
};

export function clampUnit(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** `#abc` o `#aabbcc`. Lanza si el hex no es de 3 o 6 dígitos. */
export function hexToUnit(hex: string): Rgb {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Color hex inválido: ${hex}`);
  }
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

export function mergePalette(partial?: Partial<WaterPalette>): WaterPalette {
  return {
    deep: partial?.deep ?? DEFAULT_PALETTE.deep,
    mid: partial?.mid ?? DEFAULT_PALETTE.mid,
    accent: partial?.accent ?? DEFAULT_PALETTE.accent,
    paper: partial?.paper ?? DEFAULT_PALETTE.paper,
  };
}
