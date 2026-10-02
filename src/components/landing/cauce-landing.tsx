"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthWaterBackdrop } from "@/components/auth/auth-water-shell";
import {
  CauceSignupSection,
  SIGNUP_FIRST_FIELD_ID,
  SIGNUP_SECTION_ID,
  useCaucePlans,
} from "@/components/landing/cauce-signup";
import { DemoRolePicker } from "@/components/landing/demo-role-picker";
import { DemoShowcase } from "@/components/landing/demo-showcase";
import { getToken } from "@/lib/api/session-storage";
import {
  CAUCE_FALLBACK_PLANS,
  formatPlanPriceClp,
  type SignupPlanOption,
} from "@/lib/cauce-checkout";
import { CAUCE_DEMO_NOTICE_KEY } from "@/lib/cauce-demo";
import { cn } from "@/lib/utils";
import { getHomeRouteForUser } from "@/lib/home-route";
import { useSessionStore } from "@/lib/store/session";

/**
 * Landing pública estilo smartapr.cl.
 * Usuarios con sesión → routing por rol (no ven marketing).
 */
export function CauceLanding() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const hasHydrated = useSessionStore((s) => s.hasHydrated);
  const { landing, plans, planId, setPlanId } = useCaucePlans();
  const [demoPickerOpen, setDemoPickerOpen] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    const token = getToken();
    if (!token) return;
    // Sesión existente: ir al home del rol (no mostrar landing).
    const home = getHomeRouteForUser(user);
    router.replace(home);
  }, [hasHydrated, user, router]);

  useEffect(() => {
    try {
      const notice = window.sessionStorage.getItem(CAUCE_DEMO_NOTICE_KEY);
      if (!notice) return;
      window.sessionStorage.removeItem(CAUCE_DEMO_NOTICE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- aviso one-shot desde sessionStorage al montar
      setDemoNotice(notice);
    } catch {
      /* */
    }
  }, []);

  /** Elegir plan en la tabla → registro embebido en esta misma página. */
  const choosePlan = useCallback(
    (id: string) => {
      setPlanId(id);
      const section = document.getElementById(SIGNUP_SECTION_ID);
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Foco tras el scroll (sin volver a desplazar la página).
      window.setTimeout(() => {
        document
          .getElementById(SIGNUP_FIRST_FIELD_ID)
          ?.focus({ preventScroll: true });
      }, 450);
    },
    [setPlanId],
  );

  const openDemo = useCallback(() => setDemoPickerOpen(true), []);

  const hero = landing?.group?.hero;
  const features =
    landing?.group?.features?.length
      ? landing.group.features
      : [
          {
            icon: "gauge",
            title: "Lectura y consumo",
            description: "Registro de medidores y cálculo automático por socio.",
          },
          {
            icon: "receipt",
            title: "Boletas electrónicas SII",
            description: "Emisión tributaria, al correo o WhatsApp del socio.",
          },
          {
            icon: "layers",
            title: "Subsidios estatales",
            description: "Aplicación del subsidio de agua potable (SAP).",
          },
          {
            icon: "users",
            title: "Caja y pagos en línea",
            description: "Tesorería del APR: pagos, morosidad y flujo en vivo.",
          },
        ];

  // Evita flash de landing si hay token
  if (hasHydrated && getToken()) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-tinta text-papel">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-papel/20 border-t-azul" />
      </div>
    );
  }

  return (
    <main className="bg-tinta text-papel">
      {demoNotice ? (
        <div
          role="status"
          className="relative z-30 border-b border-azul/40 bg-azul px-4 py-3 text-center text-sm text-white"
        >
          {demoNotice}
          <button
            type="button"
            onClick={() => setDemoNotice(null)}
            className="ml-3 font-accent text-[10px] uppercase tracking-[0.16em] underline"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      {/* ── HERO ── */}
      <section
        id="top"
        className="fondo-agua relative flex min-h-dvh flex-col overflow-hidden"
      >
        <AuthWaterBackdrop variant="dark" intensity={1} />
        <nav className="relative z-20 mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-5 md:px-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/cauce-wordmark-light.svg"
            alt="Cauce"
            className="h-8 w-auto md:h-10"
          />
          <div className="flex items-center gap-3 md:gap-4">
            <a
              href="#planes"
              className="font-accent hidden text-[11px] uppercase tracking-[0.22em] text-papel/70 hover:text-papel md:inline"
            >
              Planes
            </a>
            <button
              type="button"
              onClick={openDemo}
              className="font-accent hidden text-[11px] uppercase tracking-[0.22em] text-papel/80 hover:text-papel sm:inline"
            >
              Probar demo
            </button>
            <Link
              href="/login"
              className="font-accent text-[11px] uppercase tracking-[0.22em] text-papel/80 hover:text-papel"
            >
              Ingresar
            </Link>
            <a
              href={`#${SIGNUP_SECTION_ID}`}
              className="font-accent bg-azul px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-azul-deep md:px-5"
            >
              1er mes gratis
            </a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-5 pb-16 pt-10 md:px-10">
          <div className="mb-10 flex flex-wrap items-center gap-x-8 gap-y-2">
            <p className="font-accent text-[11px] uppercase tracking-[0.28em] text-papel/60">
              Smart APR SpA — Ñuble · Biobío
            </p>
            <p className="font-accent text-[11px] uppercase tracking-[0.28em] text-papel/60">
              Sistemas SSR / APR — Ley 20.998
            </p>
          </div>
          <h1 className="max-w-[14ch] font-heading text-[clamp(2.8rem,9vw,7.5rem)] font-bold leading-[0.92] tracking-[-0.03em]">
            <span className="block">
              {hero?.headline?.split(" ").slice(0, 2).join(" ") || "Tu APR,"}
            </span>
            <span className="block text-[#a5a1ff] [text-shadow:0_0_50px_rgba(56,52,255,0.9)]">
              {hero?.headline?.split(" ").slice(2).join(" ") || "organizada"}
            </span>
          </h1>
          <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-[15px] leading-relaxed text-papel/70 md:text-base">
              {hero?.subhead ||
                landing?.group?.description ||
                "Gestión hídrica para comités y cooperativas: medidores, lecturas, tarifas y cobros con boleta electrónica SII."}
            </p>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <a
                href={`#${SIGNUP_SECTION_ID}`}
                className="font-accent bg-azul px-8 py-4 text-[12px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-azul-deep"
              >
                {hero?.cta_label || "Plan Piloto — 30 días gratis"}
              </a>
              <button
                type="button"
                onClick={openDemo}
                className="font-accent border border-papel/30 px-6 py-4 text-[12px] uppercase tracking-[0.22em] text-papel transition-colors hover:border-papel hover:bg-papel/10"
              >
                Probar demo
              </button>
              <a
                href="#planes"
                className="font-accent px-2 py-4 text-[12px] uppercase tracking-[0.22em] text-papel/80"
              >
                Ver planes ↓
              </a>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pb-8 md:px-10">
          <div className="flex items-center justify-between border-t border-[var(--linea)] pt-5">
            <p className="font-accent text-[10px] uppercase tracking-[0.22em] text-papel/45">
              Implementación $0 — Sin amarras ni multas
            </p>
            <Link
              href="/login"
              className="font-accent text-[10px] uppercase tracking-[0.22em] text-azul"
            >
              Ya tengo cuenta →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="producto" className="relative bg-papel text-tinta">
        <div className="puntos-oscura pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-36">
          <div className="flex items-baseline justify-between border-t-2 border-tinta pt-4">
            <p className="font-accent text-[11px] uppercase tracking-[0.28em]">
              01 — Producto
            </p>
            <p className="font-accent hidden text-[11px] uppercase tracking-[0.28em] text-tinta/50 md:block">
              Cauce ERP
            </p>
          </div>
          <h2 className="mt-14 max-w-3xl font-heading text-[clamp(2.1rem,4.8vw,4.2rem)] font-bold leading-[1.02] tracking-[-0.02em]">
            El ERP pensado para las{" "}
            <span className="text-azul">directivas de agua potable rural.</span>
          </h2>
          <div className="mt-16 grid gap-0 md:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group border-t border-tinta/15 py-8 transition-colors hover:bg-tinta hover:text-papel md:px-6"
              >
                <p className="font-accent text-[11px] tracking-[0.2em] text-azul">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-heading text-xl font-bold tracking-[-0.01em]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-tinta/60 transition-colors group-hover:text-papel/70">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHOWCASE (componentes reales + KPIs demo) ── */}
      <DemoShowcase />

      {/* ── PLANES ── */}
      <section id="planes" className="relative bg-papel text-tinta">
        <div className="puntos-oscura pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-36">
          <div className="flex items-baseline justify-between border-t-2 border-tinta pt-4">
            <p className="font-accent text-[11px] uppercase tracking-[0.28em]">
              03 — Planes
            </p>
            <p className="font-accent hidden text-[11px] uppercase tracking-[0.28em] text-tinta/50 md:block">
              CLP mensual + IVA
            </p>
          </div>
          <div className="mt-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-2xl font-heading text-[clamp(2.1rem,4.8vw,4.2rem)] font-bold leading-[1.02] tracking-[-0.02em]">
              Precios claros,{" "}
              <span className="text-azul">sin letra chica.</span>
            </h2>
            <p className="font-accent text-[11px] uppercase tracking-[0.22em] text-tinta/55">
              Todos incluyen 1er mes gratis
            </p>
          </div>

          <div className="mt-14">
            {(plans.length ? plans : CAUCE_FALLBACK_PLANS).map((plan) => (
              <PlanRow
                key={plan.plan_id}
                plan={plan}
                selected={plan.plan_id === planId}
                onSelect={choosePlan}
              />
            ))}
            <div className="border-t border-tinta/15" />
          </div>

          <p className="mt-10 max-w-2xl font-accent text-[11px] uppercase leading-relaxed tracking-[0.14em] text-tinta/55">
            {landing?.group?.pricing_note ||
              "Implementación $0 · Sin amarras: aviso 15 días y te llevas tu base en Excel."}
          </p>

          <div className="mt-16 flex flex-wrap items-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={() => choosePlan(planId)}
              className="font-accent bg-tinta px-10 py-5 text-[12px] font-medium uppercase tracking-[0.22em] text-papel transition-colors hover:bg-azul"
            >
              Comenzar Plan Piloto — 30 días gratis →
            </button>
            <button
              type="button"
              onClick={openDemo}
              className="font-accent border border-tinta/25 px-8 py-5 text-[12px] uppercase tracking-[0.22em] text-tinta transition-colors hover:border-azul hover:text-azul"
            >
              Probar demo
            </button>
            <Link
              href="/login"
              className="font-accent text-[11px] uppercase tracking-[0.18em] text-tinta/50 hover:text-azul"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── REGISTRO (embebido: elegir plan y crear la APR sin salir) ── */}
      <CauceSignupSection
        plans={plans}
        landing={landing}
        planId={planId}
        onPlanChange={setPlanId}
        sectionLabel="04 — Registro"
      />

      {/* ── FOOTER ── */}
      <footer className="relative overflow-hidden bg-tinta">
        <div className="puntos pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-10 pt-24 md:px-10 md:pt-32">
          <p className="font-accent text-[11px] uppercase tracking-[0.28em] text-papel/50">
            05 — Contacto
          </p>
          <h2 className="mt-10 font-heading text-[clamp(2.5rem,10vw,8rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Hablemos<span className="text-azul">.</span>
          </h2>
          <a
            href={`mailto:${landing?.group?.contact_email || "contacto@smartapr.cl"}`}
            className="mt-10 inline-block font-heading text-xl font-bold tracking-[-0.01em] text-papel md:text-3xl"
          >
            {landing?.group?.contact_email || "contacto@smartapr.cl"}
          </a>
          <div className="mt-20 flex flex-col gap-4 border-t border-[var(--linea)] pt-6 md:flex-row md:items-center md:justify-between">
            <p className="font-accent text-[10px] uppercase tracking-[0.2em] text-papel/45">
              © {new Date().getFullYear()} Smart APR SpA · Cauce
            </p>
            <p className="font-accent text-[10px] uppercase tracking-[0.2em] text-azul">
              cauce.smartapr.cl
            </p>
          </div>
        </div>
      </footer>

      <DemoRolePicker
        open={demoPickerOpen}
        onClose={() => setDemoPickerOpen(false)}
      />
    </main>
  );
}

function PlanRow({
  plan,
  selected,
  onSelect,
}: {
  plan: SignupPlanOption;
  selected: boolean;
  onSelect: (planId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.plan_id)}
      aria-pressed={selected}
      aria-label={`Elegir plan ${plan.display_name} y registrarme`}
      className={cn(
        "group grid w-full grid-cols-2 items-center gap-x-6 gap-y-1 border-t border-tinta/15 py-7 text-left transition-colors duration-300 hover:bg-tinta hover:text-papel md:grid-cols-12 md:px-6 md:py-9",
        selected && "border-l-4 border-l-azul md:pl-5",
      )}
    >
      <div className="md:col-span-4">
        <h3 className="font-heading text-2xl font-bold tracking-[-0.01em] md:text-3xl">
          {plan.display_name}
        </h3>
        {plan.badge ? (
          <p className="mt-1 font-accent text-[10px] uppercase tracking-[0.14em] text-azul group-hover:text-[#a5a1ff]">
            {plan.badge}
          </p>
        ) : null}
      </div>
      <p className="font-accent text-right text-[11px] uppercase tracking-[0.18em] text-tinta/55 transition-colors group-hover:text-papel/60 md:col-span-3 md:text-left">
        {plan.audience || "—"}
      </p>
      <p className="col-span-2 mt-2 text-xl font-bold tracking-[-0.01em] md:col-span-4 md:mt-0 md:text-3xl">
        {formatPlanPriceClp(plan).replace("/mes + IVA", "")}
        <span className="ml-2 align-middle font-accent text-[10px] font-normal uppercase tracking-[0.15em] text-tinta/45 transition-colors group-hover:text-papel/50">
          /mes + IVA
        </span>
      </p>
      <span className="hidden text-right font-accent text-[10px] uppercase tracking-[0.18em] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#a5a1ff] md:col-span-1 md:block">
        {selected ? "Elegido ✓" : "Elegir →"}
      </span>
    </button>
  );
}
