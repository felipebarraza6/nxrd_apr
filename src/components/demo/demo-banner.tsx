"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { DemoRolePicker } from "@/components/landing/demo-role-picker";
import { logoutLocal } from "@/lib/logout-local";
import { STORAGE } from "@/lib/storage-keys";
import {
  CAUCE_DEMO_BRANCH_NAME,
  CAUCE_DEMO_NOTICE_KEY,
  demoSecondsRemaining,
  formatDemoCountdown,
  isCauceDemoSession,
  isDemoExpired,
} from "@/lib/cauce-demo";
import { useSessionStore } from "@/lib/store/session";
import { SIGNUP_SECTION_ID } from "@/components/landing/cauce-signup";

function readDemoExpiresAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE.demoExpiresAt);
}

/**
 * Banner sticky de sesión demo: countdown, crear APR, cambiar rol.
 * Al expirar → logout limpio a landing con aviso.
 */
export function DemoBanner() {
  const queryClient = useQueryClient();
  const user = useSessionStore((s) => s.user);
  const branches = useSessionStore((s) => s.branches);
  const currentBranchId = useSessionStore((s) => s.currentBranchId);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const branch = branches.find((b) => String(b.branch_id) === String(currentBranchId));
  const branchName =
    branch?.branch_name ??
    branch?.fantasy_name ??
    branch?.business_name ??
    null;
  const isDemo = isCauceDemoSession({
    email: user?.email,
    loginSlug:
      (branch as { login_slug?: string | null } | undefined)?.login_slug ?? null,
    branchName,
    demoExpiresAt: expiresAt,
  });

  useEffect(() => {
    setExpiresAt(readDemoExpiresAt());
  }, [user?.id]);

  const expireSession = useCallback(async () => {
    try {
      window.sessionStorage.setItem(
        CAUCE_DEMO_NOTICE_KEY,
        "La demo de 60 minutos terminó. Creá tu APR gratis o volvé a probar.",
      );
    } catch {
      /* */
    }
    await logoutLocal(queryClient);
    window.location.assign(window.location.origin + "/");
  }, [queryClient]);

  useEffect(() => {
    if (!isDemo || !expiresAt) return;
    const tick = () => {
      const left = demoSecondsRemaining(expiresAt);
      setSeconds(left);
      if (isDemoExpired(expiresAt)) {
        void expireSession();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isDemo, expiresAt, expireSession]);

  if (!isDemo) return null;

  return (
    <>
      <div
        role="status"
        className="sticky top-0 z-40 border-b border-azul/30 bg-tinta px-3 py-2 text-center text-papel"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <p className="font-accent text-[11px] font-medium uppercase tracking-[0.14em]">
            Estás en la demo de Cauce · {branchName || CAUCE_DEMO_BRANCH_NAME} ·
            quedan{" "}
            <span className="tabular-nums text-azul">{formatDemoCountdown(seconds)}</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href={`/#${SIGNUP_SECTION_ID}`}
              className="inline-flex h-8 items-center bg-azul px-3 font-accent text-[10px] font-medium uppercase tracking-[0.16em] text-white hover:bg-azul-deep"
            >
              Crear mi APR gratis
            </Link>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex h-8 items-center border border-papel/25 px-3 font-accent text-[10px] font-medium uppercase tracking-[0.16em] text-papel/80 hover:border-papel/50 hover:text-papel"
            >
              Cambiar rol
            </button>
          </div>
        </div>
      </div>
      <DemoRolePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}

/** Hook: ¿sesión demo activa? */
export function useIsCauceDemo(): boolean {
  const user = useSessionStore((s) => s.user);
  const branches = useSessionStore((s) => s.branches);
  const currentBranchId = useSessionStore((s) => s.currentBranchId);
  const branch = branches.find((b) => String(b.branch_id) === String(currentBranchId));
  const expiresAt =
    typeof window !== "undefined"
      ? window.localStorage.getItem(STORAGE.demoExpiresAt)
      : null;
  return isCauceDemoSession({
    email: user?.email,
    loginSlug:
      (branch as { login_slug?: string | null } | undefined)?.login_slug ?? null,
    branchName:
      branch?.branch_name ?? branch?.fantasy_name ?? branch?.business_name ?? null,
    demoExpiresAt: expiresAt,
  });
}
