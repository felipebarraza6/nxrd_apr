import { apiFetch, ApiError } from "@/lib/api/client";
import type { LoginCompleteResponse } from "@/lib/types";
import type { CauceDemoKpis, CauceDemoLoginRole } from "@/lib/cauce-demo";

export type CauceDemoLoginResponse = LoginCompleteResponse & {
  demo_ttl_seconds?: number;
  role?: string;
  login_slug?: string;
  branch?: {
    id: number | string;
    name?: string;
    login_slug?: string;
  };
  message?: string;
};

/** POST /api/public/cauce-demo-login/ */
export function fetchCauceDemoLogin(role: CauceDemoLoginRole) {
  return apiFetch<CauceDemoLoginResponse>("/public/cauce-demo-login/", {
    method: "POST",
    body: { role },
    auth: "none",
    branch: "none",
  });
}

/** GET /api/public/cauce-demo-kpis/ */
export function fetchCauceDemoKpis(signal?: AbortSignal) {
  return apiFetch<CauceDemoKpis>("/public/cauce-demo-kpis/", {
    method: "GET",
    auth: "none",
    branch: "none",
    signal,
  });
}

export function isDemoThrottleError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 429;
}

export function demoThrottleMessage(): string {
  return "Hay muchas personas probando la demo ahora. Esperá unos segundos e intentá de nuevo.";
}
