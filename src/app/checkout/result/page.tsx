"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type Phase = "loading" | "paid" | "failed" | "timeout" | "missing";

function readCheckoutId(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  let checkoutId = params.get("checkout") ?? params.get("checkout_id");
  if (checkoutId) return checkoutId;
  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      checkoutId = window.sessionStorage.getItem(key);
      if (checkoutId) return checkoutId;
    }
  }
  return null;
}

/**
 * Resultado de checkout (Flow o trial).
 * Static export: usa query `?checkout=<uuid>` (no segmentos dinámicos).
 */
export default function CheckoutResultPage() {
  const [checkoutId] = useState<string | null>(() => readCheckoutId());
  const [phase, setPhase] = useState<Phase>(() =>
    checkoutId ? "loading" : "missing",
  );
  const [message, setMessage] = useState(() =>
    checkoutId
      ? "Confirmando tu cuenta…"
      : "No encontramos un checkout en curso. Si acabas de pagar, revisa tu correo o vuelve a registrarte.",
  );
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) return;

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;
    const storageKey = `${STORAGE_PREFIX}${CAUCE_GROUP}`;

    const clearStored = () => {
      window.sessionStorage.removeItem(storageKey);
    };

    const finishPaid = () => {
      clearStored();
      setPaymentUrl(null);
      setPhase("paid");
      setMessage(
        "Listo. Revisa tu correo: te enviamos un enlace mágico para entrar a Cauce.",
      );
    };

    const tick = async () => {
      attempts += 1;
      try {
        const s = await fetchCheckoutStatus(checkoutId, CAUCE_GROUP);
        if (cancelled) return;
        const status = (s.status ?? "").toUpperCase();
        if (status === "PAID") {
          finishPaid();
          return;
        }
        if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED") {
          clearStored();
          setPaymentUrl(null);
          setPhase("failed");
          setMessage(
            "El pago no se completó. Puedes intentar de nuevo desde el registro.",
          );
          return;
        }
        if (s.payment_url) setPaymentUrl(s.payment_url);
        if (attempts >= POLL_MAX) {
          setPhase("timeout");
          setMessage(
            "Todavía no confirmamos el pago. Si abriste Flow, completa el pago o vuelve a intentar desde el registro.",
          );
          return;
        }
        setMessage(
          s.payment_url
            ? "Pago pendiente. Puedes abrir la pasarela mientras confirmamos el estado…"
            : "Procesando… confirmando el pago o la activación del trial.",
        );
        timer = window.setTimeout(tick, POLL_MS);
      } catch {
        if (cancelled) return;
        if (attempts >= POLL_MAX) {
          setPhase("timeout");
          setMessage(
            "No pudimos confirmar el estado. Revisa tu correo o contacta soporte.",
          );
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
  }, [checkoutId]);

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
                : phase === "missing"
                  ? "Checkout no encontrado"
                  : "Procesando…"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-papel/65">{message}</p>
        {phase === "loading" && paymentUrl ? (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-azul px-4 font-accent text-[12px] font-medium uppercase tracking-[0.18em] text-papel hover:bg-azul-deep"
          >
            Abrir pasarela de pago
          </a>
        ) : null}
        {phase !== "loading" ? (
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-azul px-4 font-accent text-[12px] font-medium uppercase tracking-[0.18em] text-papel hover:bg-azul-deep"
            >
              Ir al inicio de sesión
            </Link>
            {phase === "failed" || phase === "missing" || phase === "timeout" ? (
              <Link href="/signup" className="text-xs text-azul hover:underline">
                Volver al registro
              </Link>
            ) : null}
            {phase === "timeout" && paymentUrl ? (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-papel/70 hover:text-papel hover:underline"
              >
                Reabrir pasarela de pago
              </a>
            ) : null}
            {phase === "missing" ? (
              <Link href="/" className="text-xs text-papel/60 hover:underline">
                Ir al inicio
              </Link>
            ) : null}
          </div>
        ) : null}
      </AuthFormCard>
    </AuthWaterShell>
  );
}
