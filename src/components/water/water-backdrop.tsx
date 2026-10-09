"use client";

import "./water.css";
import type { WaterOptions } from "./mount-water";
import { WaterCanvas } from "./water-canvas";

export type WaterBackdropProps = WaterOptions & {
  /**
   * Velo oscuro a la izquierda y abajo, para que el texto de la landing lea.
   * En la app se apaga: el caudal tiene que verse en el sidebar.
   */
  scrim?: boolean;
  className?: string;
};

/** Caudal + fallback CSS + puntos. Una instancia por región. */
export function WaterBackdrop({
  variant = "dark",
  intensity = 1,
  palette,
  interactive,
  paused,
  scrim = true,
  className,
}: WaterBackdropProps) {
  const light = variant === "light";
  return (
    <div
      className={className ? `cauce-water-root ${className}` : "cauce-water-root"}
      data-water-root=""
    >
      <div
        className={light ? "cauce-water-fallback is-light" : "cauce-water-fallback"}
        aria-hidden
      />
      <WaterCanvas
        variant={variant}
        intensity={intensity}
        palette={palette}
        interactive={interactive ?? !light}
        paused={paused}
      />
      <div
        className={light ? "cauce-water-dots is-light" : "cauce-water-dots"}
        aria-hidden
      />
      {!light && scrim ? <div className="cauce-water-scrim" aria-hidden /> : null}
    </div>
  );
}
