/**
 * Constantes y helpers puros del self-signup Cauce (trial / 1er mes gratis).
 * Contrato: yggdra_infra PR #39 — POST /api/public/cauce-checkout/.
 */

import type { GroupPlanPublic, LandingConfig } from "@/lib/api/checkout";
import { formatCLP } from "@/lib/utils";

/**
 * Valor de `checkout_type` en el body de cauce-checkout (aislado aquí).
 *
 * El backend (yggdra_infra PlanCheckoutCreateSerializer) solo acepta
 * `organization` | `branch_client`. El grupo "cauce" va en la URL
 * (`/public/cauce-checkout/`), NO en checkout_type: enviar "cauce" devolvía
 * 400 `"cauce" no es una elección válida`. El self-signup de un APR crea una
 * organización/sucursal nueva → `organization`.
 */
export const CAUCE_CHECKOUT_TYPE = "organization" as const;

/** Choices válidas de checkout_type en el backend (contrato). */
export const BACKEND_CHECKOUT_TYPES = ["organization", "branch_client"] as const;

/** Grupo público / slug de landing-config. */
export const CAUCE_GROUP = "cauce" as const;

/** Plan por defecto del trial APR (ya no existe `mensual`). */
export const CAUCE_DEFAULT_PLAN_ID = "comunidad" as const;

/** @deprecated usar CAUCE_DEFAULT_PLAN_ID */
export const CAUCE_TRIAL_PLAN_ID = CAUCE_DEFAULT_PLAN_ID;

/** IDs válidos publicados por el backend Cauce. */
export const CAUCE_PLAN_IDS = [
  "comunidad",
  "crecimiento",
  "gestion_integral",
  "cooperativa",
] as const;

export type CaucePlanId = (typeof CAUCE_PLAN_IDS)[number];

export const CAUCE_FRONTEND_URL = "https://cauce.smartapr.cl";

export type SignupPlanOption = {
  plan_id: string;
  display_name: string;
  description: string;
  features: string[];
  /** Rango de arranques u audience (ej. "1 – 100 arranques"). */
  audience: string | null;
  price_clp: number | null;
  /** Cooperativa y similares: mostrar "desde" antes del precio. */
  price_from: boolean;
  price_uf: number | null;
  highlighted: boolean;
  badge: string | null;
  sort_order: number;
};

/** Fallback hardcodeado si falla landing-config / cauce-plans. */
export const CAUCE_FALLBACK_PLANS: SignupPlanOption[] = [
  {
    plan_id: "comunidad",
    display_name: "Comunidad",
    description: "Para APR pequeños.",
    features: [],
    audience: "1 – 100 arranques",
    price_clp: 30_000,
    price_from: false,
    price_uf: null,
    highlighted: true,
    badge: null,
    sort_order: 1,
  },
  {
    plan_id: "crecimiento",
    display_name: "Crecimiento",
    description: "Para sistemas en expansión.",
    features: [],
    audience: "101 – 300 arranques",
    price_clp: 40_000,
    price_from: false,
    price_uf: null,
    highlighted: false,
    badge: null,
    sort_order: 2,
  },
  {
    plan_id: "gestion_integral",
    display_name: "Gestión Integral",
    description: "Operación completa del APR.",
    features: [],
    audience: "301 – 600 arranques",
    price_clp: 80_000,
    price_from: false,
    price_uf: null,
    highlighted: false,
    badge: null,
    sort_order: 3,
  },
  {
    plan_id: "cooperativa",
    display_name: "Cooperativa",
    description: "Para cooperativas y redes grandes.",
    features: [],
    audience: "601+ arranques",
    price_clp: 170_000,
    price_from: true,
    price_uf: null,
    highlighted: false,
    badge: null,
    sort_order: 4,
  },
];

export type SignupFormValues = {
  business_name: string;
  contact_name: string;
  email: string;
  plan_id: string;
};

export type SignupFieldErrors = Partial<Record<keyof SignupFormValues, string>>;

/** Validación local antes de POST (campos requeridos + email + plan). */
export function validateSignupForm(values: SignupFormValues): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  const business = values.business_name.trim();
  const contact = values.contact_name.trim();
  const email = values.email.trim().toLowerCase();
  const planId = values.plan_id.trim();

  if (!business) errors.business_name = "Indica el nombre de tu APR.";
  else if (business.length < 2)
    errors.business_name = "El nombre de la APR debe tener al menos 2 caracteres.";
  else if (business.length > 100)
    errors.business_name = "El nombre de la APR admite hasta 100 caracteres.";
  if (!contact) errors.contact_name = "Indica el nombre de contacto.";
  else if (contact.length < 2)
    errors.contact_name = "El nombre de contacto debe tener al menos 2 caracteres.";
  else if (contact.length > 100)
    errors.contact_name = "El nombre de contacto admite hasta 100 caracteres.";
  if (!email) {
    errors.email = "Indica un correo.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Correo inválido.";
  }
  if (!planId) errors.plan_id = "Elige un plan.";
  return errors;
}

export function normalizeSignupValues(values: SignupFormValues): SignupFormValues {
  return {
    business_name: values.business_name.trim(),
    contact_name: values.contact_name.trim(),
    email: values.email.trim().toLowerCase(),
    plan_id:
      (values.plan_id || CAUCE_DEFAULT_PLAN_ID).trim() || CAUCE_DEFAULT_PLAN_ID,
  };
}

/** Body exacto del POST /public/cauce-checkout/. */
export function buildCauceCheckoutBody(values: SignupFormValues) {
  const normalized = normalizeSignupValues(values);
  return {
    checkout_type: CAUCE_CHECKOUT_TYPE,
    plan_id: normalized.plan_id,
    business_name: normalized.business_name,
    contact_name: normalized.contact_name,
    email: normalized.email,
  };
}

const SIGNUP_FIELDS = ["business_name", "contact_name", "email", "plan_id"] as const;

/** Etiquetas en español para campos del backend que no están en el form. */
const BACKEND_FIELD_LABELS: Record<string, string> = {
  checkout_type: "Tipo de registro",
  business_name: "Nombre de la APR",
  contact_name: "Nombre de contacto",
  email: "Correo",
  plan_id: "Plan",
};

function firstMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const v of value) {
      const m = firstMessage(v);
      if (m) return m;
    }
    return "";
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const m = firstMessage(v);
      if (m) return m;
    }
  }
  return "";
}

/** Traduce mensajes DRF genéricos (por si el backend responde en inglés). */
function toSpanish(field: string, message: string): string {
  const m = message.trim();
  if (/this field is required|este campo es requerido/i.test(m)) {
    switch (field) {
      case "business_name":
        return "Indica el nombre de tu APR.";
      case "contact_name":
        return "Indica el nombre de contacto.";
      case "email":
        return "Indica un correo.";
      case "plan_id":
        return "Elige un plan.";
      default:
        return "Este campo es obligatorio.";
    }
  }
  if (/valid email|correo electr[oó]nico v[aá]lid[oa]/i.test(m)) {
    return "Correo inválido. Revisa que esté bien escrito.";
  }
  if (/may not be blank|no puede estar en blanco/i.test(m)) {
    return "Este campo no puede quedar vacío.";
  }
  const min = m.match(/at least (\d+) characters/i);
  if (min) return `Debe tener al menos ${min[1]} caracteres.`;
  const max = m.match(/no more than (\d+) characters/i);
  if (max) return `Admite hasta ${max[1]} caracteres.`;
  if (/is not a valid choice/i.test(m)) return "Opción no válida.";
  return m;
}

export type SignupErrorResult = {
  fieldErrors: SignupFieldErrors;
  formError: string | null;
};

/**
 * Convierte el error del POST cauce-checkout en errores por campo (español)
 * + un mensaje general para lo que no corresponde a un campo visible.
 * Acepta `{ status, detail }` (ApiError) o un Error genérico.
 */
export function mapSignupApiError(err: unknown): SignupErrorResult {
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status: unknown }).status)
      : null;
  const detail =
    err && typeof err === "object" && "detail" in err
      ? (err as { detail: unknown }).detail
      : null;

  if (status === 429) {
    return {
      fieldErrors: {},
      formError:
        "Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.",
    };
  }
  if (status === 409) {
    return {
      fieldErrors: {
        email: "No pudimos registrar este correo. Si ya creaste tu APR, inicia sesión.",
      },
      formError: null,
    };
  }
  if (status === 503) {
    return {
      fieldErrors: {},
      formError:
        "El registro no está disponible en este momento. Escríbenos a contacto@smartapr.cl.",
    };
  }
  if (status === 408) {
    return {
      fieldErrors: {},
      formError: "El servidor tardó demasiado en responder. Inténtalo de nuevo.",
    };
  }

  const fieldErrors: SignupFieldErrors = {};
  const general: string[] = [];
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    for (const [field, value] of Object.entries(detail as Record<string, unknown>)) {
      const msg = firstMessage(value);
      if (!msg) continue;
      const es = toSpanish(field, msg);
      if ((SIGNUP_FIELDS as readonly string[]).includes(field)) {
        fieldErrors[field as keyof SignupFormValues] = es;
      } else if (
        field === "detail" ||
        field === "non_field_errors" ||
        field === "error"
      ) {
        general.push(es);
      } else {
        const label = BACKEND_FIELD_LABELS[field] ?? field;
        general.push(`${label}: ${es}`);
      }
    }
  } else if (typeof detail === "string" && detail.trim()) {
    general.push(detail.trim());
  }

  if (Object.keys(fieldErrors).length === 0 && general.length === 0) {
    if (status && status >= 500) {
      general.push("Hubo un problema en el servidor. Inténtalo de nuevo en unos minutos.");
    } else if (status === 0 || (err instanceof TypeError)) {
      general.push("No pudimos conectar con el servidor. Revisa tu conexión.");
    } else {
      general.push(
        err instanceof Error && err.message
          ? err.message
          : "No se pudo crear la cuenta. Inténtalo de nuevo.",
      );
    }
  }

  return {
    fieldErrors,
    formError: general.length ? general.join(" ") : null,
  };
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Extrae rango de arranques desde limits o audience legible. */
export function formatArranquesLabel(
  limits: Record<string, unknown> | undefined,
  audience?: string | null,
): string | null {
  if (!limits) {
    // audience del API puede ser "organization" — no es copy de UI
    if (audience?.trim() && !/^(organization|branch|client)$/i.test(audience.trim())) {
      return audience.trim();
    }
    return null;
  }
  const min =
    numOrNull(limits.arranques_min) ??
    numOrNull(limits.min_arranques) ??
    numOrNull(limits.connections_min);
  const max =
    numOrNull(limits.arranques_max) ??
    numOrNull(limits.max_arranques) ??
    numOrNull(limits.connections_max);
  if (min != null && max != null) {
    return `${min.toLocaleString("es-CL")} – ${max.toLocaleString("es-CL")} arranques`;
  }
  if (min != null && max == null) return `${min.toLocaleString("es-CL")}+ arranques`;
  if (min == null && max != null) return `Hasta ${max.toLocaleString("es-CL")} arranques`;
  if (typeof limits.arranques === "string" && limits.arranques.trim()) {
    return limits.arranques.trim();
  }
  if (audience?.trim() && !/^(organization|branch|client)$/i.test(audience.trim())) {
    return audience.trim();
  }
  return null;
}

/**
 * Precio CLP para UI: "$30.000/mes + IVA" o "Desde $170.000/mes + IVA".
 */
export function formatPlanPriceClp(
  plan: Pick<SignupPlanOption, "price_clp" | "price_from" | "plan_id">,
): string {
  if (plan.price_clp == null) return "A convenir";
  const amount = formatCLP(plan.price_clp);
  const from =
    plan.price_from || plan.plan_id === "cooperativa" ? "Desde " : "";
  return `${from}${amount}/mes + IVA`;
}

function mapPlan(p: GroupPlanPublic): SignupPlanOption {
  const priceClp = numOrNull(p.price_clp);
  const from =
    p.plan_id === "cooperativa" ||
    /desde/i.test(p.display_name) ||
    /desde/i.test(p.description ?? "");
  return {
    plan_id: p.plan_id,
    display_name: p.display_name,
    description: p.description ?? "",
    features: Array.isArray(p.features) ? p.features.filter((f) => typeof f === "string") : [],
    audience: formatArranquesLabel(p.limits, p.audience),
    price_clp: priceClp,
    price_from: from,
    price_uf: numOrNull(p.price_uf),
    highlighted: Boolean(p.highlighted),
    badge: p.badge ?? null,
    sort_order: p.sort_order ?? 0,
  };
}

/**
 * Planes para el selector de /signup desde landing-config / cauce-plans.
 * Si el request falla o viene vacío → fallback hardcodeado.
 */
export function plansFromLandingConfig(
  config: LandingConfig | null | undefined,
): SignupPlanOption[] {
  const raw = config?.plans ?? [];
  if (raw.length === 0) return CAUCE_FALLBACK_PLANS;
  return [...raw]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapPlan);
}

export function plansFromPublicList(
  plans: GroupPlanPublic[] | null | undefined,
): SignupPlanOption[] {
  if (!plans?.length) return CAUCE_FALLBACK_PLANS;
  return [...plans]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapPlan);
}

function pickPlanOption(
  plans: SignupPlanOption[],
  planId?: string,
): SignupPlanOption | null {
  if (!plans.length) return null;
  if (planId) {
    const hit = plans.find((p) => p.plan_id === planId);
    if (hit) return hit;
  }
  return (
    plans.find((p) => p.plan_id === CAUCE_DEFAULT_PLAN_ID) ??
    plans.find((p) => p.highlighted) ??
    plans[0] ??
    null
  );
}

/**
 * Copy de trial: "1er mes gratis" + precio del plan elegido.
 */
export function formatTrialPricingCopy(
  config: LandingConfig | null | undefined,
  planId?: string,
): string {
  const plans = plansFromLandingConfig(config);
  const plan = pickPlanOption(plans, planId);
  const base = "1er mes gratis, sin tarjeta; luego se cobra mensualmente";
  if (plan?.price_clp != null) {
    return `${base} (${formatPlanPriceClp(plan)}).`;
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
