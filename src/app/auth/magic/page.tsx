"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AuthBrandHeader,
  AuthFormCard,
  AuthWaterShell,
} from "@/components/auth/auth-water-shell";
import { fetchMagicLogin } from "@/lib/api/checkout";
import { completeLoginSession } from "@/lib/complete-login";
import { setInitialPassword } from "@/lib/api/auth";
import { setToken } from "@/lib/api/session-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoginCompleteResponse } from "@/lib/types";

function readMagicToken(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("token");
}

/**
 * Landing del magic-link post-trial/pago.
 * Static export: `/auth/magic?token=...` (sin segmento dinámico).
 */
export default function MagicLoginPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => readMagicToken());
  const [error, setError] = useState<string | null>(() =>
    token ? null : "Enlace incompleto: falta el token.",
  );
  const [loading, setLoading] = useState(() => Boolean(token));
  const [mustSetPassword, setMustSetPassword] = useState(false);
  const [pending, setPending] = useState<LoginCompleteResponse | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchMagicLogin(token);
        if (cancelled) return;
        if (res.must_set_password) {
          setToken(res.token);
          setPending(res);
          setMustSetPassword(true);
          setLoading(false);
          return;
        }
        await completeLoginSession(res, (path) => router.replace(path));
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Enlace inválido o expirado.",
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);
    if (newPassword.length < 8) {
      setPwdError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("Las contraseñas no coinciden.");
      return;
    }
    setPwdLoading(true);
    try {
      await setInitialPassword({
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      if (pending) {
        await completeLoginSession(pending, (path) => router.replace(path));
      }
    } catch (err) {
      setPwdError(
        err instanceof Error ? err.message : "No se pudo definir la contraseña.",
      );
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <AuthWaterShell>
      <AuthBrandHeader />
      <AuthFormCard>
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-papel/20 border-t-azul" />
            <p className="text-sm text-papel/65">Entrando a tu APR…</p>
          </div>
        ) : mustSetPassword ? (
          <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
            <div>
              <p className="font-heading text-sm font-semibold text-papel">
                Define tu contraseña
              </p>
              <p className="mt-1 text-xs text-papel/55">
                Es tu primer ingreso. Crea una contraseña para acceder después.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new_password"
                className="font-accent text-[11px] uppercase tracking-[0.18em] text-papel/55"
              >
                Nueva contraseña
              </label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-papel/20 bg-tinta/50 text-papel"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm_password"
                className="font-accent text-[11px] uppercase tracking-[0.18em] text-papel/55"
              >
                Confirmar
              </label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-papel/20 bg-tinta/50 text-papel"
              />
            </div>
            {pwdError ? (
              <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
                {pwdError}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={pwdLoading}
              className="rounded-lg bg-azul font-accent text-[12px] uppercase tracking-[0.18em] text-papel hover:bg-azul-deep"
            >
              {pwdLoading ? "Guardando…" : "Entrar"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-danger">{error ?? "No se pudo iniciar sesión."}</p>
            <Link href="/login" className="text-sm font-medium text-azul hover:underline">
              Ir al inicio de sesión
            </Link>
          </div>
        )}
      </AuthFormCard>
    </AuthWaterShell>
  );
}
