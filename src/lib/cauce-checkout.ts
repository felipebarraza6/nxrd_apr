/**
 * Constantes y helpers puros del self-signup Cauce (trial 30 días).
 * Contrato: yggdra_infra PR #39 — POST /api/public/cauce-checkout/.
 */

import type { GroupPlanPublic, LandingConfig } from "@/lib/api/checkout";

/** Valor de `checkout_type` en el body de cauce-checkout (aislado aquí). */
export const CAUCE_CHECKOUT_TYPE = "cauce" as const;

/** Grupo público / slug de landing-config. */
export const CAUCE_GROUP = "cauce" as const;

/** Plan por defecto del trial APR. */
export const CAUCE_TRIAL_PLAN_ID = "mensual" as const;

export const CAUCE_FRONTEND_URL = "https://cauce.smartapr.cl";

export type SignupFormValues = {
  business_name: string;
  contact_name: string;
  email: string;
};

export type SignupFieldErrors = Partial<Record<keyof SignupFormValues, string>>;

/** Validación local antes de POST (campos requeridos + email). */
export function validateSignupForm(values: SignupFormValues): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  const business = values.business_name.trim();
  const contact = values.contact_name.trim();
  const email = values.email.trim().toLowerCase();

  if (!business) errors.business_name = "Indica el nombre de tu APR.";
  if (!contact) errors.contact_name = "Indica el nombre de contacto.";
  if (!email) {
    errors.email = "Indica un correo.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Correo inválido.";
  }
  return errors;
}

export function normalizeSignupValues(values: SignupFormValues): SignupFormValues {
  return {
    business_name: values.business_name.trim(),
    contact_name: values.contact_name.trim(),
    email: values.email.trim().toLowerCase(),
  };
}

/** Body exacto del POST /public/cauce-checkout/. */
export function buildCauceCheckoutBody(values: SignupFormValues) {
  const normalized = normalizeSignupValues(values);
  return {
    checkout_type: CAUCE_CHECKOUT_TYPE,
    plan_id: CAUCE_TRIAL_PLAN_ID,
    business_name: normalized.business_name,
    contact_name: normalized.contact_name,
    email: normalized.email,
  };
}

function pickMensualPlan(plans: GroupPlanPublic[] | undefined): GroupPlanPublic | null {
  if (!plans?.length) return null;
  return (
    plans.find((p) => p.plan_id.trim().toLowerCase() === CAUCE_TRIAL_PLAN_ID) ??
    plans.find((p) => p.highlighted) ??
    plans[0] ??
    null
  );
}

/**
 * Copy de precio del trial. Preferencia: plan mensual de landing-config;
 * fallback si falta el catálogo.
 */
export function formatTrialPricingCopy(config: LandingConfig | null | undefined): string {
  const base = "30 días gratis, sin tarjeta; luego se cobra mensualmente";
  const plan = pickMensualPlan(config?.plans);
  if (plan?.price_uf != null && Number(plan.price_uf) > 0) {
    return `${base} (${plan.price_uf} UF/mes).`;
  }
  const note =
    config?.group?.pricing_note?.trim() ||
    config?.content?.pricing_note?.trim() ||
    "";
  if (note) return `${base}. ${note}`;
  return `${base}.`;
}

export type BillingStatusPayload = {
  is_trial?: boolean;
  status?: string | null;
  trial_ends_at?: string | null;
  days_remaining?: number | null;
  access_active?: boolean;
  plan_name?: string | null;
};

export type TrialBannerKind = "none" | "trial" | "expired";

export type TrialBannerState = {
  kind: TrialBannerKind;
  daysRemaining: number | null;
  planName: string | null;
  trialEndsAt: string | null;
  message: string;
};

/** Lógica pura del banner / bloqueo de prueba (testeable sin React). */
export function getTrialBannerState(
  status: BillingStatusPayload | null | undefined,
): TrialBannerState {
  if (!status) {
    return {
      kind: "none",
      daysRemaining: null,
      planName: null,
      trialEndsAt: null,
      message: "",
    };
  }

  const days =
    typeof status.days_remaining === "number" && Number.isFinite(status.days_remaining)
      ? Math.max(0, Math.floor(status.days_remaining))
      : null;
  const planName = status.plan_name ?? null;
  const trialEndsAt = status.trial_ends_at ?? null;

  if (status.access_active === false) {
    return {
      kind: "expired",
      daysRemaining: days,
      planName,
      trialEndsAt,
      message: "Tu prueba terminó",
    };
  }

  if (status.is_trial) {
    const n = days ?? 0;
    return {
      kind: "trial",
      daysRemaining: n,
      planName,
      trialEndsAt,
      message:
        n === 1
          ? "Te queda 1 día de prueba"
          : `Te quedan ${n} días de prueba`,
    };
  }

  return {
    kind: "none",
    daysRemaining: days,
    planName,
    trialEndsAt,
    message: "",
  };
}

/** ¿El checkout de trial ya dejó acceso sin pasar por Flow? */
export function isImmediateTrialPaid(res: {
  status?: string;
  is_trial?: boolean;
  payment_url?: string | null;
}): boolean {
  const paid = (res.status ?? "").toUpperCase() === "PAID";
  return paid && (res.is_trial === true || !res.payment_url);
}
