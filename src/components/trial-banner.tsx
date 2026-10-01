"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBillingStatus } from "@/lib/api/checkout";
import { getTrialBannerState } from "@/lib/cauce-checkout";
import { useSessionStore } from "@/lib/store/session";
import { logoutLocal } from "@/lib/logout-local";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Banner de trial (días restantes) o pantalla de bloqueo si access_active=false.
 * Datos: GET /api/plan-checkout/billing-status/ con X-Branch-ID.
 */
export function TrialBanner({ forceOverlay = false }: { forceOverlay?: boolean }) {
  const branchId = useSessionStore((s) => s.currentBranchId);
  const hasUser = useSessionStore((s) => Boolean(s.user));
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["billing-status", branchId],
    queryFn: fetchBillingStatus,
    enabled: hasUser && Boolean(branchId),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const state = getTrialBannerState(query.data);

  // Solo overlay forzado (p. ej. POS sin chrome) cuando el trial expiró.
  if (forceOverlay && state.kind !== "expired") return null;

  if (state.kind === "none" || query.isError) return null;

  if (state.kind === "expired") {
    return (
      <div
        role="alert"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-tinta/95 px-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-azul/40 bg-papel p-6 text-center shadow-xl text-tinta">
          <p className="font-heading text-lg font-semibold">{state.message}</p>
          <p className="mt-2 text-sm text-tinta/60">
            Tu acceso de prueba expiró
            {state.planName ? ` (${state.planName})` : ""}. Pronto podrás
            continuar con el cobro mensual vía Flow; mientras tanto contacta a
            soporte si necesitas ayuda.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href="mailto:contacto@smartapr.cl?subject=Prueba%20Cauce%20terminada"
              className="inline-flex h-10 items-center justify-center rounded-none bg-azul px-4 font-accent text-[12px] font-medium uppercase tracking-[0.18em] text-white hover:bg-azul-deep"
            >
              Contactar soporte
            </a>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-none border border-tinta/20 px-4 font-accent text-[12px] font-medium uppercase tracking-[0.18em] text-tinta hover:bg-tinta/5"
              onClick={async () => {
                await logoutLocal(queryClient);
                window.location.assign(window.location.origin + "/login");
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "sticky top-0 z-40 border-b border-azul/20 bg-azul px-3 py-2 text-center font-accent text-[11px] font-medium uppercase tracking-[0.18em] text-white",
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

/** True si el trial bloquea la app (para layout / POS). */
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
