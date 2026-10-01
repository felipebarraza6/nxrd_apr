import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildCauceCheckoutBody,
  CAUCE_CHECKOUT_TYPE,
  CAUCE_TRIAL_PLAN_ID,
  formatTrialPricingCopy,
  getTrialBannerState,
  isImmediateTrialPaid,
  plansFromLandingConfig,
  validateSignupForm,
} from "@/lib/cauce-checkout";

describe("validateSignupForm", () => {
  it("exige nombre APR, contacto y email válido", () => {
    expect(
      validateSignupForm({
        business_name: "",
        contact_name: "",
        email: "",
        plan_id: "",
      }),
    ).toEqual({
      business_name: "Indica el nombre de tu APR.",
      contact_name: "Indica el nombre de contacto.",
      email: "Indica un correo.",
      plan_id: "Elige un plan.",
    });
    expect(
      validateSignupForm({
        business_name: "APR Norte",
        contact_name: "Ana",
        email: "malo",
        plan_id: "mensual",
      }).email,
    ).toBe("Correo inválido.");
    expect(
      validateSignupForm({
        business_name: "APR Norte",
        contact_name: "Ana",
        email: "ana@apr.cl",
        plan_id: "mensual",
      }),
    ).toEqual({});
  });
});

describe("buildCauceCheckoutBody", () => {
  it("incluye checkout_type aislado, plan elegido y campos normalizados", () => {
    expect(
      buildCauceCheckoutBody({
        business_name: "  APR Valle  ",
        contact_name: " María ",
        email: "  Maria@APR.CL ",
        plan_id: "crecimiento",
      }),
    ).toEqual({
      checkout_type: CAUCE_CHECKOUT_TYPE,
      plan_id: "crecimiento",
      business_name: "APR Valle",
      contact_name: "María",
      email: "maria@apr.cl",
    });
    expect(CAUCE_CHECKOUT_TYPE).toBe("cauce");
  });
});

describe("plansFromLandingConfig", () => {
  it("usa fallback mensual si no hay planes", () => {
    const plans = plansFromLandingConfig(null);
    expect(plans).toHaveLength(1);
    expect(plans[0].plan_id).toBe(CAUCE_TRIAL_PLAN_ID);
  });

  it("mapea planes del landing-config ordenados", () => {
    const plans = plansFromLandingConfig({
      group: {
        slug: "cauce",
        display_name: "Cauce",
        description: "",
        integration_uf: 0,
        frontend_url: "https://cauce.smartapr.cl",
        contact_email: "a@b.cl",
        pricing_note: "",
        hero: null,
        features: [],
      },
      brand: null,
      plans: [
        {
          plan_id: "crecimiento",
          display_name: "Crecimiento",
          description: "101+",
          features: [],
          limits: {},
          price_uf: 3,
          sort_order: 2,
          highlighted: false,
          badge: null,
        },
        {
          plan_id: "mensual",
          display_name: "Comunidad",
          description: "1-100",
          features: [],
          limits: {},
          price_uf: 2,
          sort_order: 1,
          highlighted: true,
          badge: "Popular",
        },
      ],
    });
    expect(plans.map((p) => p.plan_id)).toEqual(["mensual", "crecimiento"]);
    expect(plans[0].badge).toBe("Popular");
  });
});

describe("formatTrialPricingCopy", () => {
  it("usa precio del plan mensual cuando existe", () => {
    const copy = formatTrialPricingCopy({
      group: {
        slug: "cauce",
        display_name: "Cauce",
        description: "",
        integration_uf: 0,
        frontend_url: "https://cauce.smartapr.cl",
        contact_email: "contacto@smartapr.cl",
        pricing_note: "",
        hero: null,
        features: [],
      },
      brand: null,
      plans: [
        {
          plan_id: "mensual",
          display_name: "Mensual",
          description: "",
          features: [],
          limits: {},
          price_uf: 2.5,
          sort_order: 1,
          highlighted: true,
          badge: null,
        },
      ],
    });
    expect(copy).toContain("30 días gratis, sin tarjeta");
    expect(copy).toContain("2.5 UF/mes");
  });

  it("fallback sin catálogo", () => {
    expect(formatTrialPricingCopy(null)).toBe(
      "30 días gratis, sin tarjeta; luego se cobra mensualmente.",
    );
  });
});

describe("getTrialBannerState", () => {
  it("muestra días restantes en trial activo", () => {
    const state = getTrialBannerState({
      is_trial: true,
      access_active: true,
      days_remaining: 12,
      plan_name: "Mensual",
    });
    expect(state.kind).toBe("trial");
    expect(state.message).toBe("Te quedan 12 días de prueba");
  });

  it("singulariza 1 día", () => {
    expect(
      getTrialBannerState({
        is_trial: true,
        access_active: true,
        days_remaining: 1,
      }).message,
    ).toBe("Te queda 1 día de prueba");
  });

  it("bloquea cuando access_active es false", () => {
    const state = getTrialBannerState({
      is_trial: true,
      access_active: false,
      days_remaining: 0,
    });
    expect(state.kind).toBe("expired");
    expect(state.message).toBe("Tu prueba terminó");
  });

  it("no muestra banner si no es trial y tiene acceso", () => {
    expect(
      getTrialBannerState({
        is_trial: false,
        access_active: true,
        days_remaining: null,
      }).kind,
    ).toBe("none");
  });
});

describe("isImmediateTrialPaid", () => {
  it("detecta trial PAID sin payment_url", () => {
    expect(
      isImmediateTrialPaid({
        status: "PAID",
        is_trial: true,
        payment_url: null,
      }),
    ).toBe(true);
    expect(
      isImmediateTrialPaid({
        status: "PENDING",
        payment_url: "https://flow.cl/pay",
      }),
    ).toBe(false);
  });
});

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api/client";
import { createCauceCheckout } from "@/lib/api/checkout";

const mockedFetch = vi.mocked(apiFetch);

describe("createCauceCheckout", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("POST /public/cauce-checkout/ con body de trial", async () => {
    mockedFetch.mockResolvedValueOnce({
      checkout_id: "chk-1",
      payment_url: null,
      status: "PAID",
      is_trial: true,
      days_remaining: 30,
    });
    await createCauceCheckout({
      business_name: "APR Norte",
      contact_name: "Ana",
      email: "ana@apr.cl",
      plan_id: "mensual",
    });
    expect(mockedFetch).toHaveBeenCalledWith("/public/cauce-checkout/", {
      method: "POST",
      body: {
        checkout_type: "cauce",
        plan_id: "mensual",
        business_name: "APR Norte",
        contact_name: "Ana",
        email: "ana@apr.cl",
      },
      auth: "none",
      branch: "none",
      signal: undefined,
    });
  });
});
