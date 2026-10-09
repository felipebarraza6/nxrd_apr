"use client";

import { useEffect, useRef } from "react";
import { mountWater, type WaterHandle, type WaterOptions } from "./mount-water";

export type WaterCanvasProps = WaterOptions & {
  className?: string;
};

/**
 * Canvas del caudal. Import directo: no uses next/dynamic con ssr:false.
 * El padre tiene que ser position:relative (o el root de WaterBackdrop).
 */
export function WaterCanvas({
  className = "cauce-water-canvas",
  variant = "dark",
  intensity = 1,
  palette,
  interactive,
  paused = false,
}: WaterCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const handle = useRef<WaterHandle | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const mounted = mountWater(canvas, {
      variant,
      intensity,
      palette,
      interactive,
      paused,
    });
    handle.current = mounted;
    return () => {
      mounted?.dispose();
      handle.current = null;
    };
    // El contexto vive toda la vida del canvas. Los props entran por update().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handle.current?.update({ variant, intensity, palette, interactive, paused });
  }, [variant, intensity, palette, interactive, paused]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
