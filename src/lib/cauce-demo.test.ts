import { describe, expect, it } from "vitest";
import {
  CAUCE_DEMO_EMAIL_SUFFIX,
  CAUCE_DEMO_KPI_FALLBACK,
  demoSecondsRemaining,
  formatDemoBlockedMessage,
  formatDemoCountdown,
  isCauceDemoSession,
  isDemoExpired,
  looksLikeDemoBlockedError,
  resolveDemoKpis,
} from "@/lib/cauce-demo";

describe("cauce-demo session", () => {
  it("detecta email @demo.yggdra.cl", () => {
    expect(
      isCauceDemoSession({ email: `admin${CAUCE_DEMO_EMAIL_SUFFIX}` }),
    ).toBe(true);
  });

  it("detecta login_slug y demo_expires_at", () => {
    expect(isCauceDemoSession({ loginSlug: "apr-cauce-demo" })).toBe(true);
    expect(
      isCauceDemoSession({
        demoExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe(true);
    expect(isCauceDemoSession({ email: "owner@apr.cl" })).toBe(false);
  });

  it("countdown y expiración", () => {
    const now = Date.parse("2026-10-01T12:00:00.000Z");
    const expires = "2026-10-01T12:05:30.000Z";
    expect(demoSecondsRemaining(expires, now)).toBe(330);
    expect(formatDemoCountdown(330)).toBe("05:30");
    expect(formatDemoCountdown(59)).toBe("00:59");
    expect(isDemoExpired(expires, now)).toBe(false);
    expect(isDemoExpired(expires, now + 400_000)).toBe(true);
    expect(demoSecondsRemaining(null, now)).toBe(0);
  });
});

describe("cauce-demo kpis fallback", () => {
  it("prioriza live → cache → fallback", () => {
    const live = { ...CAUCE_DEMO_KPI_FALLBACK, socios: 999 };
    const cache = { ...CAUCE_DEMO_KPI_FALLBACK, socios: 50 };
    expect(resolveDemoKpis(live, cache, false).source).toBe("live");
    expect(resolveDemoKpis(null, cache, true).source).toBe("cache");
    expect(resolveDemoKpis(null, null, true).data.demo).toBe(true);
    expect(resolveDemoKpis(null, null, true).source).toBe("fallback");
  });

  it("fallback tiene la forma completa", () => {
    const f = CAUCE_DEMO_KPI_FALLBACK;
    expect(f.consumption_by_sector.length).toBeGreaterThan(0);
    expect(f.collected.amount_clp).toBeGreaterThan(0);
    expect(f.pending.count).toBeGreaterThan(0);
  });
});

describe("cauce-demo blocked actions", () => {
  it("formatea mensaje amigable", () => {
    expect(formatDemoBlockedMessage("DTE blocked in demo")).toBe(
      "No disponible en la demo",
    );
    expect(looksLikeDemoBlockedError({ status: 403, message: "x" })).toBe(true);
    expect(looksLikeDemoBlockedError(new Error("Flow not allowed in demo"))).toBe(
      true,
    );
  });
});
