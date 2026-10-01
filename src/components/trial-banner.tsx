"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBillingStatus } from "@/lib/api/checkout";
import { getTrialBannerState } from "@/lib/cauce-checkout";
import { useSessionStore } from "@/lib/store/session";
import { cn } from "@/lib/utils";

/**
 * Banner de trial (días restantes) o pantalla de bloqueo si access_active=false.
 * Datos: GET /api/plan-checkout/billing-status/ con X-Branch-ID.
 */
export function TrialBanner() {
  const branchId = useSessionStore((s) => s.currentBranchId);
  const hasUser = useSessionStore((s) => Boolean(s.user));

  const query = useQuery({
    queryKey: ["billing-status", branchId],
    queryFn: fetchBillingStatus,
    enabled: hasUser && Boolean(branchId),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const state = getTrialBannerState(query.data);

  if (state.kind === "none" || query.isError) return null;

  if (state.kind === "expired") {
    return (
      <div
        role="alert"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061624]/95 px-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-card p-6 text-center shadow-xl">
          <p className="text-lg font-semibold text-foreground">{state.message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu acceso de prueba expiró
            {state.planName ? ` (${state.planName})` : ""}. Pronto podrás
            continuar con el cobro mensual vía Flow; mientras tanto contacta a
            soporte si necesitas ayuda.
          </p>
          <a
            href="mailto:contacto@smartapr.cl?subject=Prueba%20Cauce%20terminada"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Contactar soporte
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "sticky top-0 z-40 border-b border-sky-500/20 bg-sky-500/10 px-3 py-2 text-center text-xs font-medium text-sky-900 dark:text-sky-100",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
      )}
    >
      {state.message}
      {state.daysRemaining != null && state.daysRemaining <= 3 ? (
        <span className="ml-1 opacity-80">· Sin tarjeta durante la prueba</span>
      ) : null}
    </div>
  );
}

/** True si el trial bloquea la app (para consumidores futuros). */
export function useTrialAccessBlocked(): boolean {
  const branchId = useSessionStore((s) => s.currentBranchId);
  const hasUser = useSessionStore((s) => Boolean(s.user));
  const query = useQuery({
    queryKey: ["billing-status", branchId],
    queryFn: fetchBillingStatus,
    enabled: hasUser && Boolean(branchId),
    staleTime: 60_000,
  });
  return getTrialBannerState(query.data).kind === "expired";
}
