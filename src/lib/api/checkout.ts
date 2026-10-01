import { apiFetch } from "./client";
import type { LoginCompleteResponse } from "@/lib/types";
import {
  buildCauceCheckoutBody,
  CAUCE_GROUP,
  type BillingStatusPayload,
  type SignupFormValues,
} from "@/lib/cauce-checkout";

export interface CheckoutRequest {
  plan_id: string;
  business_name: string;
  contact_name: string;
  email: string;
  website?: string;
  /** Solo cauce-checkout (trial): ver CAUCE_CHECKOUT_TYPE. */
  checkout_type?: string;
}

export interface CheckoutResponse {
  checkout_id: string;
  payment_url: string | null;
  status: string;
  login_slug?: string | null;
  is_trial?: boolean;
  trial_ends_at?: string | null;
  days_remaining?: number | null;
}

export interface CheckoutStatus {
  status: string;
  payment_url?: string | null;
  login_slug?: string | null;
  is_trial?: boolean;
  trial_ends_at?: string | null;
  days_remaining?: number | null;
}

export type BillingStatus = BillingStatusPayload;

export function checkoutPath(group: string = CAUCE_GROUP): string {
  return `/public/${group}-checkout/`;
}

export function fetchCheckout(p: CheckoutRequest, group: string = CAUCE_GROUP, signal?: AbortSignal) {
  return apiFetch<CheckoutResponse>(checkoutPath(group), {
    method: "POST",
    body: p,
    auth: "none",
    branch: "none",
    signal,
  });
}

/**
 * Self-signup APR con trial: POST /api/public/cauce-checkout/
 * body incluye checkout_type aislado en CAUCE_CHECKOUT_TYPE.
 */
export function createCauceCheckout(values: SignupFormValues, signal?: AbortSignal) {
  return apiFetch<CheckoutResponse>(checkoutPath(CAUCE_GROUP), {
    method: "POST",
    body: buildCauceCheckoutBody(values),
    auth: "none",
    branch: "none",
    signal,
  });
}

export function fetchCheckoutStatus(id: string, group: string = CAUCE_GROUP) {
  return apiFetch<CheckoutStatus>(`${checkoutPath(group)}${id}/`, {
    auth: "none",
    branch: "none",
  });
}

/**
 * GET /api/plan-checkout/billing-status/ — estado de trial/suscripción.
 * Requiere auth + header X-Branch-ID (branch: auto).
 */
export function fetchBillingStatus() {
  return apiFetch<BillingStatus>("/plan-checkout/billing-status/", {
    auth: "required",
    branch: "auto",
  });
}

/**
 * Checkout autenticado para una sucursal existente.
 * POST /api/branches/{id}/change-plan-checkout/
 */
export function createChangePlanCheckout(
  branchId: number | string,
  planId: string,
  installmentsCount?: number,
) {
  const body: { plan_id: string; installments_count?: number } = {
    plan_id: planId,
  };
  if (installmentsCount != null) body.installments_count = installmentsCount;
  return apiFetch<CheckoutResponse>(
    `/branches/${branchId}/change-plan-checkout/`,
    { method: "POST", body },
  );
}

// ── Catálogo público de planes (landing) ─────────────────────────────────────

/** Plan de un grupo expuesto públicamente (Cauce: CLP + UF). */
export interface GroupPlanPublic {
  plan_id: string;
  display_name: string;
  /** Bajada corta del plan (fallback al copy local). */
  description: string;
  /** Bullets del plan (fallback a los recursos del copy local). */
  features: string[];
  /** Límites del plan (ej: arranques_min/max, usuarios). */
  limits: Record<string, unknown>;
  /** Precio mensual CLP (Cauce); null = a convenir / “desde”. */
  price_clp?: number | string | null;
  price_uf: number | null;
  /** Audiencia / rango de arranques (copy). */
  audience?: string | null;
  duration_days?: number | null;
  sort_order: number;
  /** Plan destacado en la landing (sello configurable vía `badge`). */
  highlighted: boolean;
  badge: string | null;
  allow_installments?: boolean;
  max_installments?: number | null;
}

/** Grupo de planes con su catálogo activo: GET /public/<grupo>-plans/. */
export interface PlanGroupPublic {
  /** Slug del grupo (ej: "cauce"). */
  name: string;
  display_name: string;
  description: string;
  /** UF cobrada una vez, sumada al precio del plan. */
  integration_uf: number;
  plans: GroupPlanPublic[];
}

export function fetchPlans(group: string = CAUCE_GROUP) {
  return apiFetch<PlanGroupPublic>(`/public/${group}-plans/`, {
    auth: "none",
    branch: "none",
  });
}

// ── Config pública de landing (white-label, una sola llamada) ────────────────

export interface LandingHero {
  headline: string;
  subhead: string;
  cta_label: string;
  /** Opcionales: el backend puede enviarlos para enriquecer el hero. */
  badge?: string;
  /** Bullets cortos de impacto; si no vienen, el hero no los muestra. */
  points?: string[];
}

export interface LandingFeatureItem {
  /** Clave de icono; el front la mapea a su librería (fallback si es desconocida). */
  icon: string;
  title: string;
  description: string;
}

export interface LandingGroupConfig {
  slug: string;
  display_name: string;
  description: string;
  integration_uf: number;
  frontend_url: string;
  contact_email: string;
  pricing_note: string;
  /** null si el grupo no tiene copy de hero (el front usa su fallback). */
  hero: LandingHero | null;
  features: LandingFeatureItem[];
}

/** Marca resuelta por dominio; null = la web usa su marca propia. */
export interface LandingBrand {
  app_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  color_mode: string;
  tagline: string;
}

export interface LandingConfig {
  group: LandingGroupConfig;
  brand: LandingBrand | null;
  /** Sucursal/org resuelta (opcional; cauce landing). */
  branch?: Record<string, unknown> | null;
  plans: GroupPlanPublic[];
  /** Bloque de contenido de la landing (todo opcional: el front tiene fallbacks). */
  content?: LandingContent | null;
}

// ── Bloque `content`: todo el copy/contenido editable del landing ───────────

export interface LandingNavItem {
  href: string;
  label: string;
}

export interface LandingCta {
  href: string;
  label: string;
}

export interface LandingContentHero {
  headline: string;
  subhead: string;
  cta_primary?: LandingCta;
  cta_secondary?: LandingCta;
}

export interface LandingUseCaseItem {
  slug: string;
  name: string;
  rubro: string;
  brand_color: string;
  highlight: string;
  demo_user: string;
  demo_password: string;
  order: number;
  active: boolean;
}

export interface LandingFooterLink {
  label: string;
  href: string;
}

export interface LandingFooterSocial {
  network: string;
  href: string;
}

export interface LandingContent {
  nav?: LandingNavItem[];
  hero?: LandingContentHero;
  features?: LandingFeatureItem[];
  use_cases?: LandingUseCaseItem[];
  pricing_note?: string;
  contact?: {
    email: string;
    demo_subject?: string;
  };
  footer?: {
    links?: LandingFooterLink[];
    social?: LandingFooterSocial[];
  };
}

/**
 * GET /public/landing-config/ — config completa de la landing (grupo + copy
 * + planes en una llamada). Resolución en el back: ?group > ?slug > Host.
 * Sin resolución → 404 (el front usa su fallback local).
 */
export function fetchLandingConfig(group?: string, slug?: string) {
  const qs = new URLSearchParams();
  if (group) qs.set("group", group);
  if (slug) qs.set("slug", slug);
  const query = qs.toString();
  return apiFetch<LandingConfig>(`/public/landing-config/${query ? `?${query}` : ""}`, {
    auth: "none",
    branch: "none",
  });
}

// ── Canje del magic-link de acceso post-pago ─────────────────────────────────

/**
 * POST /public/checkout/magic-login/ — canjea el token firmado del correo.
 * Devuelve el mismo payload que login_complete (token + user + branches).
 */
export function fetchMagicLogin(token: string) {
  return apiFetch<LoginCompleteResponse>("/public/checkout/magic-login/", {
    method: "POST",
    body: { token },
    auth: "none",
    branch: "none",
  });
}
