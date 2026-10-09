"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { completeLoginSession } from "@/lib/complete-login";
import { STORAGE } from "@/lib/storage-keys";
import {
  demoThrottleMessage,
  fetchCauceDemoLogin,
  isDemoThrottleError,
} from "@/lib/api/cauce-demo";
import {
  CAUCE_DEMO_ROLES,
  isCauceDemoSession,
  type CauceDemoLoginRole,
} from "@/lib/cauce-demo";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/**
 * Modal: elegir rol de demo → demo-login → sesión normal → home del rol.
 */
export function DemoRolePicker({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<CauceDemoLoginRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function startDemo(role: CauceDemoLoginRole) {
    setError(null);
    setLoadingRole(role);
    try {
      const token = window.localStorage.getItem(STORAGE.token);
      const demoExpiresAt = window.localStorage.getItem(STORAGE.demoExpiresAt);
      const realSession = Boolean(token) && !isCauceDemoSession({ demoExpiresAt });
      if (
        realSession &&
        !window.confirm(
          "Ya tienes una sesión iniciada. Entrar a la demo cierra esa sesión. ¿Continuar?",
        )
      ) {
        setLoadingRole(null);
        return;
      }
      const res = await fetchCauceDemoLogin(role);
      await completeLoginSession(res, (path) => {
        onClose();
        router.replace(path);
      });
    } catch (err) {
      if (isDemoThrottleError(err)) {
        setError(demoThrottleMessage());
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "No se pudo iniciar la demo. Intenta de nuevo.",
        );
      }
      setLoadingRole(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-tinta/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-picker-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg border border-papel/15 bg-tinta p-5 text-papel shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-accent text-[10px] uppercase tracking-[0.22em] text-papel/50">
              Demo · datos de ejemplo
            </p>
            <h2
              id="demo-picker-title"
              className="mt-2 font-heading text-xl font-bold tracking-[-0.02em]"
            >
              ¿Cómo quieres probar Cauce?
            </h2>
            <p className="mt-1 text-sm text-papel/60">
              Sesión de 60 minutos con datos de demostración.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-papel/50 hover:bg-papel/10 hover:text-papel"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {CAUCE_DEMO_ROLES.map((r) => {
            const loading = loadingRole === r.role;
            return (
              <button
                key={r.role}
                type="button"
                disabled={loadingRole != null}
                onClick={() => void startDemo(r.role)}
                className={cn(
                  "group flex flex-col items-start gap-1 border border-papel/15 px-4 py-4 text-left transition-colors",
                  "hover:border-azul hover:bg-azul/10 disabled:opacity-60",
                  loading && "border-azul bg-azul/15",
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-heading text-base font-semibold tracking-[-0.01em]">
                    {r.title}
                  </span>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-azul" />
                  ) : (
                    <span className="font-accent text-[10px] uppercase tracking-[0.18em] text-azul opacity-0 transition-opacity group-hover:opacity-100">
                      Entrar →
                    </span>
                  )}
                </span>
                <span className="text-sm leading-relaxed text-papel/60">
                  {r.description}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-[#ffb4b4]"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
