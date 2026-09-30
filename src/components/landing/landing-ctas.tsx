"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getToken } from "@/lib/api/session-storage";
import { useSessionStore } from "@/lib/store/session";

/**
 * CTAs del landing según sesión: si hay token, "Entrar" directo al
 * dashboard con el nombre del usuario; si no, acceso al login.
 */
const noopSubscribe = () => () => {};

export function LandingCtas() {
  const user = useSessionStore((s) => s.user);

  // Lectura cliente-only sin hydration mismatch (server snapshot = false).
  const authed = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(getToken()),
    () => false,
  );

  if (!authed) {
    return (
      <Link
        href="/login"
        className="rounded-xl bg-sky-400 px-8 py-3 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-400/30 transition-colors hover:bg-sky-300"
      >
        Ingresar
      </Link>
    );
  }

  const firstName = (user?.first_name || user?.username || "").split(" ")[0];
  return (
    <div className="flex flex-col items-center gap-2">
      <Link
        href="/dashboard"
        className="rounded-xl bg-sky-400 px-8 py-3 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-400/30 transition-colors hover:bg-sky-300"
      >
        Entrar
      </Link>
      {firstName && (
        <p className="text-xs text-sky-200/80">
          Hola de nuevo, <span className="font-semibold">{firstName}</span>
        </p>
      )}
    </div>
  );
}
