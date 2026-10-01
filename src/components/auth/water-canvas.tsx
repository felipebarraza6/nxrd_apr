"use client";

import { useEffect, useRef } from "react";

export type WaterVariant = "dark" | "light";

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/** Fragment con variante dark (hero) / light (app shell) + intensidad. */
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_rip[8];
uniform float u_intensity;
uniform float u_light; // 0 = dark, 1 = light

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;
  float t = u_time * 0.16;

  vec2 disp = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    float age = u_time - u_rip[i].z;
    if (age > 0.0 && age < 2.6) {
      vec2 rp = u_rip[i].xy;
      rp.x *= u_res.x / u_res.y;
      vec2 dv = p - rp;
      float rd = length(dv) + 0.0001;
      float front = age * 0.42;
      float env = exp(-2.1 * age) * exp(-12.0 * abs(rd - front));
      disp += (dv / rd) * sin(26.0 * (rd - front)) * env * 0.04 * u_intensity;
    }
  }

  vec2 q = vec2(fbm(p * 2.1 + t + disp * 9.0),
                fbm(p * 2.1 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 2.1 + 3.4 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(p * 2.1 + 3.4 * q + vec2(8.3, 2.8) - 0.12 * t));
  float f = fbm(p * 2.1 + 3.0 * r + disp * 14.0);

  vec3 deep  = vec3(0.0, 0.008, 0.05);
  vec3 medio = vec3(0.012, 0.059, 0.78);
  vec3 elec  = vec3(0.22, 0.204, 1.0);
  vec3 papel = vec3(0.953);
  vec3 tinta = vec3(0.02);

  vec3 darkCol = mix(deep, medio, smoothstep(0.15, 0.85, f));
  float caustica = pow(clamp(f * 1.75 - 0.34, 0.0, 1.0), 3.0);
  darkCol = mix(darkCol, elec, caustica * 0.85 * u_intensity);
  darkCol += elec * 0.22 * u_intensity * smoothstep(0.66, 0.71, f) * (1.0 - smoothstep(0.71, 0.78, f));

  // Light: papel con ripples azul/tinta sutiles (invertido)
  float inkMask = pow(clamp(f * 1.4 - 0.25, 0.0, 1.0), 2.2) * u_intensity;
  vec3 lightCol = mix(papel, mix(tinta, elec, 0.55), inkMask * 0.22);
  lightCol += elec * 0.04 * u_intensity * smoothstep(0.55, 0.72, f);

  vec2 m = u_mouse;
  m.x *= u_res.x / u_res.y;
  float md = length(p - m);
  darkCol += elec * 0.09 * u_intensity * exp(-md * 3.2);
  lightCol += elec * 0.03 * u_intensity * exp(-md * 3.2);

  float vig = smoothstep(1.3, 0.3, length(uv - vec2(0.5, 0.45)) * 1.3);
  darkCol *= mix(0.4, 1.0, vig);
  lightCol *= mix(0.92, 1.0, vig);

  vec3 col = mix(darkCol, lightCol, u_light);
  float alpha = mix(1.0, 0.55 * u_intensity + 0.15, u_light);
  gl_FragColor = vec4(col, alpha);
}
`;

export type WaterCanvasProps = {
  className?: string;
  /** dark = hero/auth; light = shell sobre papel. */
  variant?: WaterVariant;
  /** 0–1; light suele ir 0.25–0.45. */
  intensity?: number;
};

/**
 * Fondo WebGL de agua (smartapr.cl). Un contexto por instancia.
 * Pausado con tab oculta / reduced-motion; DPR cap en móvil.
 */
export default function WaterCanvas({
  className = "",
  variant = "dark",
  intensity = 1,
}: WaterCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const variantRef = useRef(variant);
  const intensityRef = useRef(Math.max(0, Math.min(1, intensity)));

  useEffect(() => {
    variantRef.current = variant;
    intensityRef.current = Math.max(0, Math.min(1, intensity));
  }, [variant, intensity]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isLight = () => variantRef.current === "light";
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const program = gl.createProgram();
    if (!program) return;
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uRip = gl.getUniformLocation(program, "u_rip");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uLight = gl.getUniformLocation(program, "u_light");

    const ripples = new Float32Array(24).fill(-100);
    let ripIdx = 0;
    const mouse = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6 };
    const t0 = performance.now();
    const elapsed = () => (performance.now() - t0) / 1000;

    const isMobile =
      typeof window !== "undefined" &&
      (window.matchMedia("(max-width: 768px)").matches ||
        ("ontouchstart" in window && navigator.maxTouchPoints > 0));
    const dprScale = isMobile
      ? Math.min(window.devicePixelRatio || 1, 1) * 0.4
      : Math.min(window.devicePixelRatio || 1, 1.5) * (isLight() ? 0.45 : 0.6);

    const resize = () => {
      const w = Math.max(2, Math.floor(canvas.clientWidth * dprScale));
      const h = Math.max(2, Math.floor(canvas.clientHeight * dprScale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const addRipple = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      ripples[ripIdx * 3] = (clientX - rect.left) / rect.width;
      ripples[ripIdx * 3 + 1] = 1 - (clientY - rect.top) / rect.height;
      ripples[ripIdx * 3 + 2] = elapsed();
      ripIdx = (ripIdx + 1) % 8;
    };

    let lastRipple = 0;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - rect.left) / rect.width;
      mouse.ty = 1 - (e.clientY - rect.top) / rect.height;
      const now = performance.now();
      if (now - lastRipple > 350) {
        lastRipple = now;
        addRipple(e.clientX, e.clientY);
      }
    };
    const onDown = (e: PointerEvent) => addRipple(e.clientX, e.clientY);

    const host = canvas.parentElement ?? canvas;
    if (!isLight()) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerdown", onDown);
    }

    let raf = 0;
    let visible = true;
    let pageVisible = !document.hidden;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const drawFrame = (freezeTime?: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, freezeTime ?? elapsed());
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform3fv(uRip, ripples);
      gl.uniform1f(uIntensity, intensityRef.current);
      gl.uniform1f(uLight, isLight() ? 1 : 0);
      if (isLight()) {
        gl.clearColor(0.953, 0.953, 0.953, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = () => {
      raf = 0;
      if (!visible || !pageVisible || reduced) return;
      drawFrame();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced) {
        drawFrame(0.8);
        return;
      }
      if (!raf && visible && pageVisible) {
        raf = requestAnimationFrame(loop);
      }
    };

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(canvas);
    start();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
