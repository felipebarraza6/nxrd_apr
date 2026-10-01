import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildCauceCheckoutBody,
  CAUCE_CHECKOUT_TYPE,
  CAUCE_DEFAULT_PLAN_ID,
  formatPlanPriceClp,
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
        plan_id: "comunidad",
      }).email,
    ).toBe("Correo inválido.");
    expect(
      validateSignupForm({
        business_name: "APR Norte",
        contact_name: "Ana",
        email: "ana@apr.cl",
        plan_id: "comunidad",
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
    expect(CAUCE_DEFAULT_PLAN_ID).toBe("comunidad");
  });

  it("default plan_id es comunidad si viene vacío", () => {
    expect(
      buildCauceCheckoutBody({
        business_name: "APR",
        contact_name: "Ana",
        email: "a@b.cl",
        plan_id: "",
      }).plan_id,
    ).toBe("comunidad");
  });
});

describe("plansFromLandingConfig", () => {
  it("usa fallback hardcodeado (4 planes) si no hay catálogo", () => {
    const plans = plansFromLandingConfig(null);
    expect(plans.map((p) => p.plan_id)).toEqual([
      "comunidad",
      "crecimiento",
      "gestion_integral",
      "cooperativa",
    ]);
    expect(plans[0].price_clp).toBe(30_000);
    expect(plans[3].price_from).toBe(true);
    expect(plans[3].audience).toContain("601");
  });

  it("mapea planes del landing-config ordenados con CLP y arranques", () => {
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
      branch: null,
      plans: [
        {
          plan_id: "crecimiento",
          display_name: "Crecimiento",
          description: "En expansión",
          features: ["Lecturas", "Boletas"],
          limits: { arranques_min: 101, arranques_max: 300 },
          price_clp: 40000,
          price_uf: null,
          audience: null,
          sort_order: 2,
          highlighted: false,
          badge: null,
        },
        {
          plan_id: "comunidad",
          display_name: "Comunidad",
          description: "Pequeños",
          features: ["Lecturas"],
          limits: {},
          price_clp: 30000,
          price_uf: null,
          audience: "1 – 100 arranques",
          sort_order: 1,
          highlighted: true,
          badge: "Popular",
        },
      ],
    });
    expect(plans.map((p) => p.plan_id)).toEqual(["comunidad", "crecimiento"]);
    expect(plans[0].badge).toBe("Popular");
    expect(plans[0].audience).toBe("1 – 100 arranques");
    expect(plans[1].audience).toContain("101");
    expect(formatPlanPriceClp(plans[0])).toMatch(/\$30\.000\/mes \+ IVA/);
  });
});

describe("formatPlanPriceClp", () => {
  it("Cooperativa muestra 'Desde'", () => {
    expect(
      formatPlanPriceClp({
        plan_id: "cooperativa",
        price_clp: 170_000,
        price_from: true,
      }),
    ).toMatch(/^Desde \$170\.000\/mes \+ IVA$/);
  });
});

describe("formatTrialPricingCopy", () => {
  it("usa 1er mes gratis y precio CLP del plan", () => {
    const copy = formatTrialPricingCopy(
      {
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
            plan_id: "comunidad",
            display_name: "Comunidad",
            description: "",
            features: [],
            limits: {},
            price_clp: 30000,
            price_uf: null,
            sort_order: 1,
            highlighted: true,
            badge: null,
          },
        ],
      },
      "comunidad",
    );
    expect(copy).toContain("1er mes gratis");
    expect(copy).toContain("$30.000");
  });

  it("fallback sin catálogo", () => {
    const copy = formatTrialPricingCopy(null, "comunidad");
    expect(copy).toContain("1er mes gratis");
    expect(copy).toContain("$30.000");
  });
});

describe("getTrialBannerState", () => {
  it("muestra días restantes en trial activo", () => {
    const state = getTrialBannerState({
      is_trial: true,
      access_active: true,
      days_remaining: 12,
      plan_name: "Comunidad",
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

  it("POST /public/cauce-checkout/ con plan comunidad", async () => {
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
      plan_id: "comunidad",
    });
    expect(mockedFetch).toHaveBeenCalledWith("/public/cauce-checkout/", {
      method: "POST",
      body: {
        checkout_type: "cauce",
        plan_id: "comunidad",
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
