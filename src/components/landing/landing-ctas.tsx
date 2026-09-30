"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/api/session-storage";
import { useSessionStore } from "@/lib/store/session";

/**
 * CTAs del landing según sesión: si hay token, "Entrar" directo al
 * dashboard con el nombre del usuario; si no, acceso al login.
 */
export function LandingCtas() {
  const user = useSessionStore((s) => s.user);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(Boolean(getToken()));
  }, []);

  if (authed === null) {
    // Evita flash: mismo layout que el estado final
    return <div className="mt-10 flex gap-3 opacity-0">
      <div className="h-12 w-44 rounded-xl bg-sky-400" />
      <div className="h-12 w-44 rounded-xl border border-sky-300/40" />
    </div>;
  }

  if (authed) {
    const firstName = (user?.first_name || user?.username || "").split(" ")[0];
    return (
      <div className="mt-10 flex flex-col items-center gap-2">
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

  return (
    <Link
      href="/login"
      className="rounded-xl bg-sky-400 px-8 py-3 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-400/30 transition-colors hover:bg-sky-300"
    >
      Ingresar
    </Link>
  );
}
