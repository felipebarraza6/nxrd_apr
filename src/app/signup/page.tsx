"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthBrandHeader,
  AuthFormCard,
  AuthWaterShell,
} from "@/components/auth/auth-water-shell";
import { ApiError, formatFieldErrors } from "@/lib/api/client";
import {
  createCauceCheckout,
  fetchLandingConfig,
  type LandingConfig,
} from "@/lib/api/checkout";
import {
  CAUCE_GROUP,
  CAUCE_TRIAL_PLAN_ID,
  formatTrialPricingCopy,
  isImmediateTrialPaid,
  plansFromLandingConfig,
  validateSignupForm,
  type SignupFieldErrors,
  type SignupFormValues,
  type SignupPlanOption,
} from "@/lib/cauce-checkout";
import { cn } from "@/lib/utils";

type Phase = "form" | "done" | "redirecting";

export default function SignupPage() {
  const router = useRouter();
  const [landing, setLanding] = useState<LandingConfig | null>(null);
  const plans = useMemo(() => plansFromLandingConfig(landing), [landing]);
  const [values, setValues] = useState<SignupFormValues>({
    business_name: "",
    contact_name: "",
    email: "",
    plan_id: CAUCE_TRIAL_PLAN_ID,
  });
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [loginSlug, setLoginSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLandingConfig(CAUCE_GROUP)
      .then((cfg) => {
        if (cancelled) return;
        setLanding(cfg);
        const list = plansFromLandingConfig(cfg);
        const preferred =
          list.find((p) => p.highlighted)?.plan_id ??
          list.find((p) => p.plan_id === CAUCE_TRIAL_PLAN_ID)?.plan_id ??
          list[0]?.plan_id ??
          CAUCE_TRIAL_PLAN_ID;
        setValues((s) => ({ ...s, plan_id: preferred }));
      })
      .catch(() => {
        if (!cancelled) setLanding(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pricingCopy = formatTrialPricingCopy(landing, values.plan_id);

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
      router.replace(`/checkout/result?checkout=${encodeURIComponent(res.checkout_id)}`);
    } catch (err) {
      const fields = formatFieldErrors(err);
      const mapped: SignupFieldErrors = {};
      if (fields.business_name) mapped.business_name = fields.business_name;
      if (fields.contact_name) mapped.contact_name = fields.contact_name;
      if (fields.email) mapped.email = fields.email;
      if (fields.plan_id) mapped.plan_id = fields.plan_id;
      setFieldErrors(mapped);
      if (Object.keys(mapped).length === 0) {
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
    <AuthWaterShell>
      <AuthBrandHeader title="Crea tu APR en minutos" subtitle={pricingCopy} />

      {phase === "done" ? (
        <AuthFormCard className="text-center">
          <p className="font-heading text-base font-semibold text-azul">Cuenta lista</p>
          <p className="mt-2 text-sm leading-relaxed text-papel/75">
            Revisa tu correo: te enviamos un enlace mágico para entrar a Cauce.
            No necesitas tarjeta durante la prueba.
          </p>
          {loginSlug ? (
            <p className="mt-3 font-accent text-[11px] uppercase tracking-[0.18em] text-papel/45">
              Portal: /{loginSlug}
            </p>
          ) : null}
          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-azul px-4 font-accent text-[12px] font-medium uppercase tracking-[0.18em] text-papel hover:bg-azul-deep"
          >
            Ir al inicio de sesión
          </Link>
        </AuthFormCard>
      ) : (
        <AuthFormCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <PlanSelector
              plans={plans}
              value={values.plan_id}
              error={fieldErrors.plan_id}
              onChange={(plan_id) => setValues((s) => ({ ...s, plan_id }))}
            />
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
              <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={loading || phase === "redirecting"}
              className="mt-1 rounded-lg bg-azul font-accent text-[12px] uppercase tracking-[0.18em] text-papel hover:bg-azul-deep"
            >
              {loading || phase === "redirecting"
                ? "Creando cuenta…"
                : "Empezar prueba gratis"}
            </Button>

            <p className="text-center text-xs text-papel/50">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-medium text-azul hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </AuthFormCard>
      )}
    </AuthWaterShell>
  );
}

function PlanSelector({
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
      <legend className="font-accent text-[11px] font-medium uppercase tracking-[0.18em] text-papel/55">
        Plan
      </legend>
      <div className="flex flex-col gap-2">
        {plans.map((plan) => {
          const selected = plan.plan_id === value;
          return (
            <button
              key={plan.plan_id}
              type="button"
              onClick={() => onChange(plan.plan_id)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-azul bg-azul/20"
                  : "border-papel/15 bg-tinta/40 hover:border-papel/30",
              )}
              aria-pressed={selected}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-sm font-semibold text-papel">
                  {plan.display_name}
                </span>
                {plan.price_uf != null && Number(plan.price_uf) > 0 ? (
                  <span className="font-accent text-[11px] uppercase tracking-[0.14em] text-papel/60">
                    {plan.price_uf} UF/mes
                  </span>
                ) : plan.badge ? (
                  <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-azul">
                    {plan.badge}
                  </span>
                ) : plan.highlighted ? (
                  <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-azul">
                    Recomendado
                  </span>
                ) : null}
              </div>
              {plan.description ? (
                <p className="mt-1 text-xs leading-relaxed text-papel/55">
                  {plan.description}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </fieldset>
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
      <label
        htmlFor={id}
        className="font-accent text-[11px] font-medium uppercase tracking-[0.18em] text-papel/55"
      >
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
        className={cn(
          "border-papel/20 bg-tinta/50 text-papel placeholder:text-papel/35",
          error && "border-danger",
        )}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
