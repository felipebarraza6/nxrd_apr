"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, formatFieldErrors } from "@/lib/api/client";
import {
  createCauceCheckout,
  fetchLandingConfig,
} from "@/lib/api/checkout";
import {
  CAUCE_GROUP,
  formatTrialPricingCopy,
  isImmediateTrialPaid,
  validateSignupForm,
  type SignupFieldErrors,
  type SignupFormValues,
} from "@/lib/cauce-checkout";
import { FRIG_IDENTITY_STYLE } from "@/lib/frig-identity";
import { HeroPlexus } from "@/components/landing/hero-plexus";
import { cn } from "@/lib/utils";

type Phase = "form" | "done" | "redirecting";

export default function SignupPage() {
  const router = useRouter();
  const [values, setValues] = useState<SignupFormValues>({
    business_name: "",
    contact_name: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pricingCopy, setPricingCopy] = useState(formatTrialPricingCopy(null));
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [loginSlug, setLoginSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLandingConfig(CAUCE_GROUP)
      .then((cfg) => {
        if (!cancelled) setPricingCopy(formatTrialPricingCopy(cfg));
      })
      .catch(() => {
        if (!cancelled) setPricingCopy(formatTrialPricingCopy(null));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const local = validateSignupForm(values);
    setFieldErrors(local);
    if (Object.keys(local).length > 0) return;

    setLoading(true);
    try {
      const res = await createCauceCheckout(values);
      if (isImmediateTrialPaid(res)) {
        setLoginSlug(res.login_slug ?? null);
        setPhase("done");
        return;
      }
      if (res.payment_url) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            `cauce.checkout_id.${CAUCE_GROUP}`,
            res.checkout_id,
          );
        }
        setPhase("redirecting");
        window.location.assign(res.payment_url);
        return;
      }
      // Sin payment_url ni trial inmediato: ir a resultado para polling.
      router.replace(`/checkout/result?checkout=${encodeURIComponent(res.checkout_id)}`);
    } catch (err) {
      const fields = formatFieldErrors(err);
      const mapped: SignupFieldErrors = {};
      if (fields.business_name) mapped.business_name = fields.business_name;
      if (fields.contact_name) mapped.contact_name = fields.contact_name;
      if (fields.email) mapped.email = fields.email;
      setFieldErrors(mapped);
      const hasField = Object.keys(mapped).length > 0;
      if (!hasField) {
        setFormError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "No se pudo crear la cuenta.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-dvh flex-1 flex-col bg-[#061624] text-zinc-100"
      style={FRIG_IDENTITY_STYLE}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 115%, rgba(56,189,248,0.16), transparent 70%)",
          }}
        />
        <HeroPlexus className="absolute inset-0 opacity-50" />
      </div>

      <main className="relative z-[1] mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/cauce-wordmark-light.svg"
            alt="Cauce"
            className="h-16 w-auto sm:h-20"
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-300/90">
            un producto de Smart APR SpA
          </p>
          <h1 className="mt-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Crea tu APR en minutos
          </h1>
          <p className="text-sm text-zinc-400">{pricingCopy}</p>
        </div>

        {phase === "done" ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="text-base font-semibold text-sky-200">Cuenta lista</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Revisa tu correo: te enviamos un enlace mágico para entrar a Cauce.
              No necesitas tarjeta durante la prueba.
            </p>
            {loginSlug ? (
              <p className="mt-3 text-xs text-zinc-500">
                Portal:{" "}
                <span className="font-medium text-zinc-300">/{loginSlug}</span>
              </p>
            ) : null}
            <Link
              href="/login"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
            noValidate
          >
            <Field
              id="business_name"
              label="Nombre de la APR"
              value={values.business_name}
              error={fieldErrors.business_name}
              placeholder="APR Valle Norte"
              onChange={(v) => setValues((s) => ({ ...s, business_name: v }))}
            />
            <Field
              id="contact_name"
              label="Nombre de contacto"
              value={values.contact_name}
              error={fieldErrors.contact_name}
              placeholder="María Pérez"
              onChange={(v) => setValues((s) => ({ ...s, contact_name: v }))}
            />
            <Field
              id="email"
              label="Correo"
              type="email"
              autoComplete="email"
              value={values.email}
              error={fieldErrors.email}
              placeholder="contacto@apr.cl"
              onChange={(v) => setValues((s) => ({ ...s, email: v }))}
            />

            {formError ? (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={loading || phase === "redirecting"}
              className="mt-1 rounded-lg bg-primary text-white hover:bg-primary/90"
            >
              {loading || phase === "redirecting"
                ? "Creando cuenta…"
                : "Empezar prueba gratis"}
            </Button>

            <p className="text-center text-xs text-zinc-500">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-medium text-sky-300 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-200">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        className={cn(error && "border-danger")}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
