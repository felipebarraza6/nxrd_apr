"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCheckoutStatus } from "@/lib/api/checkout";
import { CAUCE_GROUP } from "@/lib/cauce-checkout";
import { FRIG_IDENTITY_STYLE } from "@/lib/frig-identity";

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
      // Sin id: legacy Flow → volver a home.
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
    <div
      className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 bg-[#061624] px-4 text-zinc-100"
      style={FRIG_IDENTITY_STYLE}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/cauce-symbol.svg" alt="" className="h-10 w-auto opacity-90" />
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-10 text-center">
        {phase === "loading" ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        ) : null}
        <div>
          <p className="text-sm font-semibold tracking-wide">
            {phase === "paid"
              ? "Cuenta activada"
              : phase === "failed"
                ? "Pago no completado"
                : phase === "timeout"
                  ? "Pendiente de confirmación"
                  : "Procesando…"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{message}</p>
        </div>
        {phase !== "loading" ? (
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Ir al inicio de sesión
            </Link>
            {phase === "failed" ? (
              <Link href="/signup" className="text-xs text-sky-300 hover:underline">
                Volver al registro
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
