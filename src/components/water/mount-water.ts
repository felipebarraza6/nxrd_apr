import { clampUnit, mergePalette, type WaterPalette } from "./palette";
import { RIPPLE_COUNT, WATER_SHADERS } from "./shaders";

export type WaterVariant = "dark" | "light";

export type WaterOptions = {
  variant?: WaterVariant;
  /** 0 apaga las vetas. 1 es el caudal de la landing. */
  intensity?: number;
  palette?: Partial<WaterPalette>;
  /**
   * Ondas al mover el puntero. El listener va al padre del root,
   * así el canvas puede ser `pointer-events: none` y no tapa los clics.
   */
  interactive?: boolean;
  /** Congela un cuadro. También se congela con prefers-reduced-motion. */
  paused?: boolean;
};

export type WaterHandle = {
  update(next: WaterOptions): void;
  dispose(): void;
};

type State = {
  variant: WaterVariant;
  intensity: number;
  palette: WaterPalette;
  interactive: boolean;
  paused: boolean;
};

const RIPPLE_FLOATS = RIPPLE_COUNT * 3;

function dprScale(variant: WaterVariant): number {
  const mobile =
    window.matchMedia("(max-width: 768px)").matches ||
    ("ontouchstart" in window && navigator.maxTouchPoints > 0);
  const dpr = window.devicePixelRatio || 1;
  if (mobile) return Math.min(dpr, 1) * 0.4;
  return Math.min(dpr, 1.5) * (variant === "light" ? 0.45 : 0.6);
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "shader";
    gl.deleteShader(shader);
    if (!gl.isContextLost()) console.error(`[water] ${log}`);
    return null;
  }
  return shader;
}

function hide(canvas: HTMLCanvasElement) {
  canvas.dataset.water = "off";
  canvas.style.visibility = "hidden";
}

/**
 * Arranca el caudal en un canvas que ya está en el documento.
 * Devuelve null si no hay WebGL: el canvas queda transparente y se ve el CSS.
 *
 * No llama a WEBGL_lose_context. En desarrollo React monta el efecto dos
 * veces; perder el contexto deja el segundo pase sin shader.
 */
export function mountWater(canvas: HTMLCanvasElement, options: WaterOptions = {}): WaterHandle | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) {
    canvas.dataset.water = "off";
    return null;
  }

  const program = gl.createProgram();
  const vertex = compile(gl, gl.VERTEX_SHADER, WATER_SHADERS.vert);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, WATER_SHADERS.frag);
  if (!program || !vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    hide(canvas);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (!gl.isContextLost()) console.error(`[water] ${gl.getProgramInfoLog(program) || "link"}`);
    gl.deleteProgram(program);
    hide(canvas);
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "u_res");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uMouse = gl.getUniformLocation(program, "u_mouse");
  const uRip = gl.getUniformLocation(program, "u_rip[0]");
  const uIntensity = gl.getUniformLocation(program, "u_intensity");
  const uLight = gl.getUniformLocation(program, "u_light");
  const uDeep = gl.getUniformLocation(program, "u_deep");
  const uMid = gl.getUniformLocation(program, "u_mid");
  const uAccent = gl.getUniformLocation(program, "u_accent");
  const uPaper = gl.getUniformLocation(program, "u_paper");

  const state: State = {
    variant: options.variant ?? "dark",
    intensity: clampUnit(options.intensity ?? 1),
    palette: mergePalette(options.palette),
    interactive: options.interactive ?? (options.variant ?? "dark") !== "light",
    paused: options.paused ?? false,
  };

  const ripples = new Float32Array(RIPPLE_FLOATS).fill(-100);
  let rippleSlot = 0;
  const mouse = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6 };
  const startedAt = performance.now();
  const elapsed = () => (performance.now() - startedAt) / 1000;

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedQuery.matches;
  let raf = 0;
  let visible = true;
  let pageVisible = !document.hidden;
  let disposed = false;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const resize = () => {
    const scale = dprScale(state.variant);
    const width = Math.max(2, Math.floor(canvas.clientWidth * scale));
    const height = Math.max(2, Math.floor(canvas.clientHeight * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const draw = (freezeAt?: number) => {
    if (disposed || gl.isContextLost()) return;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    const [dr, dg, db] = state.palette.deep;
    const [mr, mg, mb] = state.palette.mid;
    const [ar, ag, ab] = state.palette.accent;
    const [pr, pg, pb] = state.palette.paper;
    gl.useProgram(program);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, freezeAt ?? elapsed());
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1fv(uRip, ripples);
    gl.uniform1f(uIntensity, state.intensity);
    gl.uniform1f(uLight, state.variant === "light" ? 1 : 0);
    gl.uniform3f(uDeep, dr, dg, db);
    gl.uniform3f(uMid, mr, mg, mb);
    gl.uniform3f(uAccent, ar, ag, ab);
    gl.uniform3f(uPaper, pr, pg, pb);
    if (state.variant === "light") {
      gl.clearColor(0.953, 0.953, 0.953, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = () => {
    raf = 0;
    if (disposed || !visible || !pageVisible || reduced || state.paused) return;
    draw();
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    if (disposed) return;
    if (reduced || state.paused) {
      draw(reduced ? 0.8 : elapsed());
      return;
    }
    if (!raf && visible && pageVisible) raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const addRipple = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const base = rippleSlot * 3;
    ripples[base] = (clientX - rect.left) / rect.width;
    ripples[base + 1] = 1 - (clientY - rect.top) / rect.height;
    ripples[base + 2] = elapsed();
    rippleSlot = (rippleSlot + 1) % RIPPLE_COUNT;
  };

  let lastRipple = 0;
  const onMove = (event: PointerEvent) => {
    if (!state.interactive) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1 - (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    mouse.tx = x;
    mouse.ty = y;
    const now = performance.now();
    if (now - lastRipple > 350) {
      lastRipple = now;
      addRipple(event.clientX, event.clientY);
    }
  };
  const onDown = (event: PointerEvent) => {
    if (!state.interactive) return;
    addRipple(event.clientX, event.clientY);
  };

  const root = canvas.closest("[data-water-root]");
  const host =
    root?.parentElement instanceof HTMLElement
      ? root.parentElement
      : (canvas.parentElement ?? canvas);

  const onVisibility = () => {
    pageVisible = !document.hidden;
    if (pageVisible) start();
    else stop();
  };
  const onMotion = () => {
    reduced = reducedQuery.matches;
    if (reduced) stop();
    start();
  };

  const resizeObserver = new ResizeObserver(() => resize());
  resize();
  resizeObserver.observe(canvas);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  reducedQuery.addEventListener("change", onMotion);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerdown", onDown);

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible) start();
    else stop();
  });
  intersection.observe(canvas);
  start();

  return {
    update(next) {
      if (disposed) return;
      if (next.variant) state.variant = next.variant;
      if (next.intensity !== undefined) state.intensity = clampUnit(next.intensity);
      if (next.palette) state.palette = mergePalette({ ...state.palette, ...next.palette });
      if (next.interactive !== undefined) state.interactive = next.interactive;
      if (next.paused !== undefined) state.paused = next.paused;
      resize();
      if (state.paused || reduced) stop();
      start();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onMotion);
      window.removeEventListener("resize", resize);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
