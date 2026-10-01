/**
 * Demo pública de Cauce (APR Río Claro).
 * Contrato: yggdra_infra PR #42 — cauce-demo-login / cauce-demo-kpis.
 */

export const CAUCE_DEMO_LOGIN_SLUG = "apr-cauce-demo";
export const CAUCE_DEMO_BRANCH_NAME = "APR Río Claro (demo)";
export const CAUCE_DEMO_EMAIL_SUFFIX = "@demo.yggdra.cl";
export const CAUCE_DEMO_KPI_CACHE_KEY = "cauce.demo_kpis.v1";
export const CAUCE_DEMO_NOTICE_KEY = "cauce.demo_notice";

/** Roles del body POST /public/cauce-demo-login/. */
export type CauceDemoLoginRole = "ADMIN" | "MEDIDOR" | "CAJERO";

export const CAUCE_DEMO_ROLES: Array<{
  role: CauceDemoLoginRole;
  title: string;
  description: string;
}> = [
  {
    role: "ADMIN",
    title: "Administrador",
    description: "Dashboard, socios, tarifarios, corridas de cobro y configuración del APR.",
  },
  {
    role: "MEDIDOR",
    title: "Medidor en terreno",
    description: "POS casa por casa: tomá lecturas medidor a medidor en la ruta.",
  },
  {
    role: "CAJERO",
    title: "Cajero",
    description: "Cargos pendientes, cobros y caja de la oficina del APR.",
  },
];

export type CauceDemoKpis = {
  branch: {
    id: number;
    name: string;
    login_slug: string;
    commune: string | null;
    region: string | null;
  };
  period: string;
  socios: number;
  meters: number;
  readings_this_month: number;
  m3_this_month: number;
  collected: { count: number; amount_clp: number };
  pending: { count: number; amount_clp: number };
  consumption_by_sector: Array<{
    sector: string;
    socios: number;
    m3: number;
    readings: number;
  }>;
  demo: true;
};

/** Dataset estático (misma forma) si el endpoint falla o hace 429. */
export const CAUCE_DEMO_KPI_FALLBACK: CauceDemoKpis = {
  branch: {
    id: 0,
    name: CAUCE_DEMO_BRANCH_NAME,
    login_slug: CAUCE_DEMO_LOGIN_SLUG,
    commune: "San Carlos",
    region: "Ñuble",
  },
  period: "2026-10",
  socios: 128,
  meters: 134,
  readings_this_month: 119,
  m3_this_month: 1842.5,
  collected: { count: 96, amount_clp: 2_880_000 },
  pending: { count: 23, amount_clp: 690_000 },
  consumption_by_sector: [
    { sector: "Centro", socios: 42, m3: 610.2, readings: 40 },
    { sector: "Norte", socios: 38, m3: 520.0, readings: 35 },
    { sector: "Sur", socios: 31, m3: 412.8, readings: 28 },
    { sector: "Alto", socios: 17, m3: 299.5, readings: 16 },
  ],
  demo: true,
};

export type DemoSessionHints = {
  email?: string | null;
  loginSlug?: string | null;
  branchName?: string | null;
  demoExpiresAt?: string | null;
};

/** True si la sesión actual es la demo de Cauce. */
export function isCauceDemoSession(hints: DemoSessionHints): boolean {
  const email = (hints.email ?? "").toLowerCase();
  if (email.endsWith(CAUCE_DEMO_EMAIL_SUFFIX)) return true;
  if (hints.demoExpiresAt) return true;
  const slug = (hints.loginSlug ?? "").toLowerCase();
  if (slug === CAUCE_DEMO_LOGIN_SLUG) return true;
  const branch = (hints.branchName ?? "").toLowerCase();
  if (branch.includes("río claro") || branch.includes("rio claro")) return true;
  if (branch.includes("(demo)")) return true;
  return false;
}

/** Segundos restantes hasta demo_expires_at (0 si ya expiró). */
export function demoSecondsRemaining(
  expiresAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): number {
  if (!expiresAtIso) return 0;
  const t = Date.parse(expiresAtIso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((t - nowMs) / 1000));
}

export function formatDemoCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function isDemoExpired(
  expiresAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!expiresAtIso) return false;
  return demoSecondsRemaining(expiresAtIso, nowMs) <= 0;
}

/** Mensaje amigable cuando el backend bloquea acciones de demo. */
export function formatDemoBlockedMessage(raw?: string | null): string {
  const text = (raw ?? "").toLowerCase();
  if (
    text.includes("demo") ||
    text.includes("dte") ||
    text.includes("sii") ||
    text.includes("flow") ||
    text.includes("email") ||
    text.includes("correo") ||
    text.includes("not allowed") ||
    text.includes("forbidden") ||
    text.includes("no disponible")
  ) {
    return "No disponible en la demo";
  }
  return "No disponible en la demo";
}

export function looksLikeDemoBlockedError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";
  const lower = msg.toLowerCase();
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: number }).status)
      : undefined;
  if (status === 403 || status === 402) return true;
  return (
    lower.includes("demo") ||
    lower.includes("not allowed in demo") ||
    lower.includes("dte") ||
    lower.includes("flow")
  );
}

export function readDemoKpiCache(): CauceDemoKpis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CAUCE_DEMO_KPI_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CauceDemoKpis;
    if (!parsed || typeof parsed !== "object" || !parsed.demo) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDemoKpiCache(data: CauceDemoKpis): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CAUCE_DEMO_KPI_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

/** Resuelve KPIs: cache → fetch → fallback. */
export function resolveDemoKpis(
  fetched: CauceDemoKpis | null,
  fromCache: CauceDemoKpis | null,
  failed: boolean,
): { data: CauceDemoKpis; source: "live" | "cache" | "fallback" } {
  if (fetched) return { data: fetched, source: "live" };
  if (fromCache) return { data: fromCache, source: "cache" };
  if (failed) return { data: CAUCE_DEMO_KPI_FALLBACK, source: "fallback" };
  return { data: fromCache ?? CAUCE_DEMO_KPI_FALLBACK, source: fromCache ? "cache" : "fallback" };
}
