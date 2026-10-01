"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AuthBrandHeader,
  AuthFormCard,
  AuthWaterShell,
} from "@/components/auth/auth-water-shell";
import { fetchCheckoutStatus } from "@/lib/api/checkout";
import { CAUCE_GROUP } from "@/lib/cauce-checkout";

const STORAGE_PREFIX = "cauce.checkout_id.";
const POLL_MS = 3000;
const POLL_MAX = 80;

type Phase = "loading" | "paid" | "failed" | "timeout";

/**
 * Resultado de checkout (Flow o trial).
 * Static export: usa query `?checkout=<uuid>` (no segmentos dinámicos).
 */
export default function CheckoutResultPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("Confirmando tu cuenta…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let checkoutId =
      params.get("checkout") ??
      params.get("checkout_id");

    if (!checkoutId) {
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          checkoutId = window.sessionStorage.getItem(key);
          if (checkoutId) break;
        }
      }
    }

    if (!checkoutId) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const finishPaid = () => {
      window.sessionStorage.removeItem(`${STORAGE_PREFIX}${CAUCE_GROUP}`);
      setPhase("paid");
      setMessage(
        "Listo. Revisa tu correo: te enviamos un enlace mágico para entrar a Cauce.",
      );
    };

    const tick = async () => {
      attempts += 1;
      try {
        const s = await fetchCheckoutStatus(checkoutId!, CAUCE_GROUP);
        if (cancelled) return;
        const status = (s.status ?? "").toUpperCase();
        if (status === "PAID") {
          finishPaid();
          return;
        }
        if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED") {
          setPhase("failed");
          setMessage("El pago no se completó. Puedes intentar de nuevo desde el registro.");
          return;
        }
        if (attempts >= POLL_MAX) {
          setPhase("timeout");
          setMessage(
            "Todavía no confirmamos el pago. Revisa tu correo en unos minutos o vuelve a intentar.",
          );
          return;
        }
        timer = window.setTimeout(tick, POLL_MS);
      } catch {
        if (cancelled) return;
        if (attempts >= POLL_MAX) {
          setPhase("timeout");
          setMessage("No pudimos confirmar el estado. Revisa tu correo o contacta soporte.");
          return;
        }
        timer = window.setTimeout(tick, POLL_MS);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <AuthWaterShell>
      <AuthBrandHeader />
      <AuthFormCard className="text-center">
        {phase === "loading" ? (
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-papel/20 border-t-azul" />
        ) : null}
        <p className="mt-3 font-heading text-sm font-semibold tracking-wide text-papel">
          {phase === "paid"
            ? "Cuenta activada"
            : phase === "failed"
              ? "Pago no completado"
              : phase === "timeout"
                ? "Pendiente de confirmación"
                : "Procesando…"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-papel/65">{message}</p>
        {phase !== "loading" ? (
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-azul px-4 font-accent text-[12px] font-medium uppercase tracking-[0.18em] text-papel hover:bg-azul-deep"
            >
              Ir al inicio de sesión
            </Link>
            {phase === "failed" ? (
              <Link href="/signup" className="text-xs text-azul hover:underline">
                Volver al registro
              </Link>
            ) : null}
          </div>
        ) : null}
      </AuthFormCard>
    </AuthWaterShell>
  );
}
