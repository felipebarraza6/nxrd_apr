import { describe, expect, it } from "vitest";
import {
  CAUCE_DEFAULT_PLAN_ID,
  CAUCE_FALLBACK_PLANS,
  formatArranquesLabel,
  formatPlanPriceClp,
  plansFromLandingConfig,
} from "@/lib/cauce-checkout";

describe("landing / planes smoke", () => {
  it("default plan es comunidad y fallback tiene 4 planes", () => {
    expect(CAUCE_DEFAULT_PLAN_ID).toBe("comunidad");
    expect(CAUCE_FALLBACK_PLANS).toHaveLength(4);
    expect(CAUCE_FALLBACK_PLANS.map((p) => p.plan_id)).toEqual([
      "comunidad",
      "crecimiento",
      "gestion_integral",
      "cooperativa",
    ]);
  });

  it("mapea limits de arranques aunque audience sea organization", () => {
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
          plan_id: "comunidad",
          display_name: "Comunidad",
          description: "",
          features: ["Mes 1 gratis"],
          limits: { arranques_min: 1, arranques_max: 100 },
          price_clp: 30000,
          price_uf: null,
          audience: "organization",
          sort_order: 1,
          highlighted: true,
          badge: "ENTRADA",
        },
      ],
    });
    expect(plans[0].audience).toContain("1");
    expect(plans[0].audience).toContain("100");
    expect(formatPlanPriceClp(plans[0])).toContain("$30.000");
  });

  it("formatArranquesLabel ignora audience tipada", () => {
    expect(formatArranquesLabel({ arranques_min: 601 }, "organization")).toBe(
      "601+ arranques",
    );
  });
});
