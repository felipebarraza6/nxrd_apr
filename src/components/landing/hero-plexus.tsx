"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo líquido de Cauce: capas de ondas de agua que fluyen lentamente,
 * con burbujas que ascienden. El cursor genera ondas (ripples) al moverse.
 * Se tiñe con el primary de la marca activa (re-tinte en vivo).
 */
export function HeroPlexus({
  className,
  idleBoost = 1,
}: {
  className?: string;
  /** Multiplica el brillo en reposo (1 = landing). */
  idleBoost?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const idleBoostRef = useRef(idleBoost);

  useEffect(() => {
    idleBoostRef.current = idleBoost;
  }, [idleBoost]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let t = 0;
    const mouse = { x: -9999, y: -9999 };
    const ripples: Array<{ x: number; y: number; r: number; a: number }> = [];

    // Paleta agua Cauce/Smart APR; mezclada en vivo con el primary de marca.
    const WATER_PALETTE = [
      "56, 189, 248",
      "14, 165, 233",
      "2, 132, 199",
      "3, 105, 161",
      "125, 211, 252",
      "186, 230, 253",
    ];
    let PALETTE = [...WATER_PALETTE];

    function mix(a: number, b: number, k: number) {
      return Math.round(a + (b - a) * k);
    }

    function retint() {
      const cs = getComputedStyle(document.documentElement);
      const hex = (cs.getPropertyValue("--color-primary") || "").trim();
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!m) return;
      const r = parseInt(m[1], 16);
      const g = parseInt(m[2], 16);
      const b = parseInt(m[3], 16);
      PALETTE = WATER_PALETTE.map((rgb) => {
        const [pr, pg, pb] = rgb.split(",").map(Number);
        return `${mix(pr, r, 0.35)}, ${mix(pg, g, 0.35)}, ${mix(pb, b, 0.35)}`;
      });
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    type Bubble = {
      x: number;
      y: number;
      r: number;
      speed: number;
      wobble: number;
      color: string;
    };
    let bubbles: Bubble[] = [];

    function seedBubbles() {
      const count = Math.min(70, Math.floor((w * h) / 18000));
      bubbles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 3.2,
        speed: 0.15 + Math.random() * 0.45,
        wobble: Math.random() * Math.PI * 2,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      }));
    }

    function waveY(x: number, layer: number, boost: number): number {
      const yBase = h * (0.55 + layer * 0.11);
      const amp = (14 + layer * 10) * boost;
      const speed = 0.35 + layer * 0.18;
      const wavelength = 220 - layer * 30;
      return (
        yBase +
        Math.sin((x / wavelength) * Math.PI * 2 + t * speed + layer * 1.7) * amp +
        Math.sin((x / (wavelength * 0.5)) * Math.PI * 2 - t * speed * 0.6) *
          amp *
          0.35
      );
    }

    function drawWaves(boost: number) {
      const layers = 4;
      for (let layer = 0; layer < layers; layer++) {
        const color = PALETTE[layer % PALETTE.length];
        const alpha = (0.05 + layer * 0.05) * boost;
        const yBase = h * (0.55 + layer * 0.11);
        const amp = (14 + layer * 10) * boost;

        // Relleno translúcido de la capa
        ctx!.beginPath();
        ctx!.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) ctx!.lineTo(x, waveY(x, layer, boost));
        ctx!.lineTo(w, h);
        ctx!.closePath();
        const grad = ctx!.createLinearGradient(0, yBase - amp * 2, 0, h);
        grad.addColorStop(0, `rgba(${color}, ${alpha * 0.9})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        ctx!.fillStyle = grad;
        ctx!.fill();

        // Línea de cresta
        ctx!.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = waveY(x, layer, boost);
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = `rgba(${color}, ${alpha * 1.6})`;
        ctx!.lineWidth = 1.2;
        ctx!.stroke();
      }
    }

    function drawBubbles(boost: number) {
      for (const b of bubbles) {
        b.y -= b.speed * boost;
        b.wobble += 0.02;
        if (b.y < -10) {
          b.y = h + 10;
          b.x = Math.random() * w;
        }
        const x = b.x + Math.sin(b.wobble) * 6;
        ctx!.beginPath();
        ctx!.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${b.color}, ${0.35 * boost})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${b.color}, ${0.25 * boost})`;
        ctx!.fill();
      }
    }

    function drawRipples() {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 2.4;
        rp.a -= 0.012;
        if (rp.a <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx!.beginPath();
        ctx!.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${PALETTE[1]}, ${rp.a})`;
        ctx!.lineWidth = 1.4;
        ctx!.stroke();
      }
    }

    function frame() {
      t += 0.016;
      const boost = idleBoostRef.current;
      ctx!.clearRect(0, 0, w, h);
      drawWaves(boost);
      drawBubbles(boost);
      drawRipples();
      raf = requestAnimationFrame(frame);
    }

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (
        Math.hypot(x - mouse.x, y - mouse.y) > 60 &&
        ripples.length < 12 &&
        y > h * 0.3
      ) {
        ripples.push({ x, y, r: 4, a: 0.5 });
      }
      mouse.x = x;
      mouse.y = y;
    }

    function onResize() {
      resize();
      seedBubbles();
    }

    const themeObserver = new MutationObserver(retint);
    retint();
    resize();
    seedBubbles();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      themeObserver.disconnect();
    };
  }, [idleBoost]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
