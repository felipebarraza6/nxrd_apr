"use client";

import { forwardRef, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormCard, AuthWaterBackdrop } from "@/components/auth/auth-water-shell";
import {
  createCauceCheckout,
  fetchLandingConfig,
  type LandingConfig,
} from "@/lib/api/checkout";
import {
  CAUCE_DEFAULT_PLAN_ID,
  CAUCE_GROUP,
  CAUCE_PLAN_IDS,
  plansFromLandingConfig,
  formatPlanPriceClp,
  formatTrialPricingCopy,
  isImmediateTrialPaid,
  mapSignupApiError,
  validateSignupForm,
  type SignupFieldErrors,
  type SignupFormValues,
  type SignupPlanOption,
} from "@/lib/cauce-checkout";
import { cn } from "@/lib/utils";

type Phase = "form" | "done" | "redirecting";

/** id del input que recibe foco al elegir un plan en la landing. */
export const SIGNUP_FIRST_FIELD_ID = "signup-business_name";
/** Ancla de la sección de registro embebida en la landing. */
export const SIGNUP_SECTION_ID = "registro";

function preferredPlanId(list: SignupPlanOption[], fromQuery: string | null) {
  return (
    (fromQuery && list.find((p) => p.plan_id === fromQuery)?.plan_id) ||
    list.find((p) => p.plan_id === CAUCE_DEFAULT_PLAN_ID)?.plan_id ||
    list.find((p) => p.highlighted)?.plan_id ||
    list[0]?.plan_id ||
    CAUCE_DEFAULT_PLAN_ID
  );
}

/**
 * Carga landing-config (planes + copy) y mantiene el plan elegido.
 * Respeta `?plan=<id>` (links viejos a /signup?plan=… y /?plan=…).
 */
export function useCaucePlans() {
  const [landing, setLanding] = useState<LandingConfig | null>(null);
  const [planId, setPlanId] = useState<string>(CAUCE_DEFAULT_PLAN_ID);
  const plans = useMemo(() => plansFromLandingConfig(landing), [landing]);

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("plan");
    let cancelled = false;
    fetchLandingConfig(CAUCE_GROUP)
      .then((cfg) => {
        if (cancelled) return;
        setLanding(cfg);
        const list = plansFromLandingConfig(cfg);
        setPlanId((current) =>
          current !== CAUCE_DEFAULT_PLAN_ID && list.some((p) => p.plan_id === current)
            ? current
            : preferredPlanId(list, fromQuery),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setLanding(null);
        if (fromQuery && (CAUCE_PLAN_IDS as readonly string[]).includes(fromQuery)) {
          setPlanId(fromQuery);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { landing, plans, planId, setPlanId };
}

/**
 * Sección de registro Cauce (agua oscura, tokens de la landing).
 * La usan la landing `/` (embebida bajo los planes) y `/signup` (fallback).
 * Solo pide: plan, nombre de la APR, nombre de contacto y correo.
 */
export function CauceSignupSection({
  plans,
  landing,
  planId,
  onPlanChange,
  standalone = false,
  sectionLabel = "03 — Registro",
}: {
  plans: SignupPlanOption[];
  landing: LandingConfig | null;
  planId: string;
  onPlanChange: (planId: string) => void;
  /** true en /signup: ocupa la pantalla completa y muestra el logo. */
  standalone?: boolean;
  sectionLabel?: string;
}) {
  const pricingCopy = formatTrialPricingCopy(landing, planId);
  return (
    <section
      id={SIGNUP_SECTION_ID}
      className={cn(
        "fondo-agua relative scroll-mt-4 overflow-hidden bg-tinta text-papel",
        standalone && "flex min-h-dvh flex-col",
      )}
    >
      <AuthWaterBackdrop variant="dark" intensity={1} />
      {standalone ? (
        <nav className="relative z-20 mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-5 md:px-10">
          <Link href="/" aria-label="Volver al inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/cauce-wordmark-light.svg"
              alt="Cauce"
              className="h-8 w-auto md:h-10"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-accent text-[11px] uppercase tracking-[0.22em] text-papel/70 hover:text-papel"
            >
              ← Inicio
            </Link>
            <Link
              href="/login"
              className="font-accent text-[11px] uppercase tracking-[0.22em] text-papel/80 hover:text-papel"
            >
              Ingresar
            </Link>
          </div>
        </nav>
      ) : null}
      <div
        className={cn(
          "relative z-10 mx-auto grid w-full max-w-[1400px] gap-12 px-5 md:px-10 lg:grid-cols-12 lg:gap-16",
          standalone ? "flex-1 items-center py-10 md:py-16" : "py-24 md:py-36",
        )}
      >
        <div className="lg:col-span-5">
          <div className="flex items-baseline justify-between border-t-2 border-papel/80 pt-4">
            <p className="font-accent text-[11px] uppercase tracking-[0.28em] text-papel/70">
              {sectionLabel}
            </p>
            <p className="font-accent hidden text-[11px] uppercase tracking-[0.28em] text-papel/45 md:block">
              Sin tarjeta
            </p>
          </div>
          <h2 className="mt-10 font-heading text-[clamp(2.1rem,4.8vw,4.2rem)] font-bold leading-[1.02] tracking-[-0.02em]">
            Crea tu APR{" "}
            <span className="text-[#a5a1ff] [text-shadow:0_0_40px_rgba(56,52,255,0.8)]">
              en minutos.
            </span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-papel/70">
            {pricingCopy}
          </p>
          <ul className="mt-8 space-y-3 font-accent text-[11px] uppercase tracking-[0.18em] text-papel/60">
            <li>— Implementación $0</li>
            <li>— Acceso inmediato por correo</li>
            <li>— Sin amarras: aviso 15 días y export Excel</li>
          </ul>
        </div>
        <div className="lg:col-span-7 lg:pl-8">
          <CauceSignupForm
            plans={plans}
            planId={planId}
            onPlanChange={onPlanChange}
          />
        </div>
      </div>
    </section>
  );
}

/** Formulario de registro (4 campos). Errores 400 del backend por campo. */
export function CauceSignupForm({
  plans,
  planId,
  onPlanChange,
}: {
  plans: SignupPlanOption[];
  planId: string;
  onPlanChange: (planId: string) => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Omit<SignupFormValues, "plan_id">>({
    business_name: "",
    contact_name: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [loginSlug, setLoginSlug] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string>("");

  function update(field: keyof Omit<SignupFormValues, "plan_id">, v: string) {
    setValues((s) => ({ ...s, [field]: v }));
    if (fieldErrors[field]) {
      setFieldErrors((e) => ({ ...e, [field]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const full: SignupFormValues = { ...values, plan_id: planId };
    const local = validateSignupForm(full);
    setFieldErrors(local);
    if (Object.keys(local).length > 0) return;

    setLoading(true);
    try {
      const res = await createCauceCheckout(full);
      if (isImmediateTrialPaid(res)) {
        setLoginSlug(res.login_slug ?? null);
        setSentTo(full.email.trim().toLowerCase());
        setPhase("done");
        return;
      }
      if (res.payment_url) {
        window.sessionStorage.setItem(
          `cauce.checkout_id.${CAUCE_GROUP}`,
          res.checkout_id,
        );
        setPhase("redirecting");
        window.location.assign(res.payment_url);
        return;
      }
      router.replace(
        `/checkout/result?checkout=${encodeURIComponent(res.checkout_id)}`,
      );
    } catch (err) {
      const mapped = mapSignupApiError(err);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
    } finally {
      setLoading(false);
    }
  }

  if (phase === "done") {
    return (
      <AuthFormCard className="rounded-none text-center">
        <div role="status" aria-live="polite">
          <p className="font-accent text-[11px] uppercase tracking-[0.22em] text-[#a5a1ff]">
            Cuenta lista
          </p>
          <p className="mt-3 font-heading text-2xl font-bold tracking-[-0.01em]">
            Revisa tu correo
          </p>
          <p className="mt-3 text-sm leading-relaxed text-papel/75">
            Te enviamos un enlace de acceso{sentTo ? ` a ${sentTo}` : ""} para
            entrar a Cauce. No necesitas tarjeta durante la prueba.
          </p>
          {loginSlug ? (
            <p className="mt-3 font-accent text-[11px] uppercase tracking-[0.18em] text-papel/45">
              Portal: /{loginSlug}
            </p>
          ) : null}
          <Link
            href="/login"
            className="font-accent mt-6 inline-flex h-11 items-center justify-center bg-azul px-6 text-[12px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-azul-deep"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard className="rounded-none sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <PlanPicker
          plans={plans}
          value={planId}
          error={fieldErrors.plan_id}
          onChange={(id) => {
            onPlanChange(id);
            if (fieldErrors.plan_id) {
              setFieldErrors((e) => ({ ...e, plan_id: undefined }));
            }
          }}
        />
        <Field
          id={SIGNUP_FIRST_FIELD_ID}
          label="Nombre de la APR"
          value={values.business_name}
          error={fieldErrors.business_name}
          placeholder="APR Valle Norte"
          autoComplete="off"
          onChange={(v) => update("business_name", v)}
        />
        <Field
          id="signup-contact_name"
          label="Nombre de contacto"
          value={values.contact_name}
          error={fieldErrors.contact_name}
          placeholder="María Pérez"
          autoComplete="name"
          onChange={(v) => update("contact_name", v)}
        />
        <Field
          id="signup-email"
          label="Correo"
          type="email"
          autoComplete="email"
          value={values.email}
          error={fieldErrors.email}
          placeholder="contacto@apr.cl"
          hint="Aquí te llega el enlace de acceso."
          onChange={(v) => update("email", v)}
        />

        {formError ? (
          <p
            role="alert"
            className="border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-papel"
          >
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={loading || phase === "redirecting"}
          className="font-accent mt-1 h-12 rounded-none bg-azul text-[12px] font-medium uppercase tracking-[0.22em] text-white hover:bg-azul-deep"
        >
          {loading || phase === "redirecting"
            ? "Creando tu APR…"
            : "Empezar 30 días gratis →"}
        </Button>

        <p className="text-center text-xs text-papel/50">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-[#a5a1ff] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthFormCard>
  );
}

function PlanPicker({
  plans,
  value,
  error,
  onChange,
}: {
  plans: SignupPlanOption[];
  value: string;
  error?: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-accent text-[11px] font-medium uppercase tracking-[0.18em] text-papel/55">
        Plan · 1er mes gratis
      </legend>
      <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
        {plans.map((plan) => {
          const selected = plan.plan_id === value;
          return (
            <button
              key={plan.plan_id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(plan.plan_id)}
              className={cn(
                "border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-azul bg-azul/25"
                  : "border-papel/15 bg-tinta/40 hover:border-papel/35",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-heading text-sm font-bold text-papel">
                  {plan.display_name}
                </span>
                {selected ? (
                  <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-[#a5a1ff]">
                    Elegido
                  </span>
                ) : null}
              </div>
              {plan.audience ? (
                <p className="mt-0.5 font-accent text-[10px] uppercase tracking-[0.14em] text-papel/50">
                  {plan.audience}
                </p>
              ) : null}
              <p className="mt-1 font-accent text-[11px] uppercase tracking-[0.1em] text-papel/75">
                {formatPlanPriceClp(plan)}
              </p>
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

const Field = forwardRef<
  HTMLInputElement,
  {
    id: string;
    label: string;
    value: string;
    error?: string;
    hint?: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    autoComplete?: string;
  }
>(function Field(
  { id, label, value, error, hint, onChange, placeholder, type = "text", autoComplete },
  ref,
) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-accent text-[11px] font-medium uppercase tracking-[0.18em] text-papel/55"
      >
        {label}
      </label>
      <Input
        ref={ref}
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 rounded-none border-papel/20 bg-tinta/50 text-papel placeholder:text-papel/35",
          error && "border-danger",
        )}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-papel/45">{hint}</p>
      ) : null}
    </div>
  );
});
