import type { Metadata } from "next";
import Link from "next/link";
import { StandaloneRedirect } from "@/components/standalone-redirect";
import { HeroPlexus } from "@/components/landing/hero-plexus";
import { LandingCtas } from "@/components/landing/landing-ctas";

export const metadata: Metadata = {
  title: "Cauce by Smart APR — Gestión de APR: socios, medidores y cobros",
  description:
    "Sistema para Agua Potable Rural: socios, puntos de medición, lecturas casa por casa, tarifarios por tramo, cobros con boleta electrónica SII e informes para la asamblea. Plan Piloto 30 días gratis.",
};

const FEATURES = [
  {
    title: "POS de lectura casa por casa",
    description:
      "El lector recorre la ruta y toma la lectura medidor a medidor, como un POS: rápido, con consumo calculado al instante.",
  },
  {
    title: "Tarifarios por tramo",
    description:
      "Cargo fijo mensual + tramos por m³ con vigencias. El cargo de cada socio se calcula solo.",
  },
  {
    title: "Cobros con boleta electrónica",
    description:
      "Corrida de cobro del período y emisión de boletas al SII en lote. Subsidios estatales soportados.",
  },
  {
    title: "Caja de oficina",
    description:
      "Pagos de socios en efectivo con arqueo diario. Cada peso cuadrado al cierre.",
  },
  {
    title: "Morosidad al día",
    description:
      "Deuda por socio, pendientes por pagar y reportes listos para la asamblea o Ley 20.998.",
  },
  {
    title: "Materiales y compras",
    description:
      "Medidores de repuesto, cloro y cañerías: inventario por bodega y compras a proveedores.",
  },
];

const PLANS = [
  {
    name: "Plan Comunidad",
    range: "1 a 100 medidores",
    price: "$30.000",
    unit: "CLP/mes",
    highlight: false,
  },
  {
    name: "Plan Crecimiento",
    range: "101 a 300 medidores",
    price: "$40.000",
    unit: "CLP/mes",
    highlight: false,
  },
  {
    name: "Plan Gestión Integral",
    range: "301 a 600 medidores",
    price: "$80.000",
    unit: "CLP/mes",
    highlight: true,
  },
  {
    name: "Plan Cooperativa",
    range: "Más de 600 medidores",
    price: "Desde $170.000",
    unit: "CLP/mes",
    highlight: false,
  },
];

const TRUST = [
  {
    title: "Plan Piloto: 30 días gratis",
    description:
      "Un mes completo de prueba sin costo, con migración inicial de la base de socios 100% gratuita.",
  },
  {
    title: "Implementación $0",
    description:
      "Migración de socios, deudas históricas y configuración con el SII sin costo de entrada.",
  },
  {
    title: "Sin amarras ni multas",
    description:
      "Sin exclusividad ni multas por salida. Si te vas, tu base de datos completa va con vos en Excel.",
  },
  {
    title: "Soporte en terreno",
    description:
      "Soporte prioritario por WhatsApp y teléfono, y asistencia presencial en Ñuble y Biobío.",
  },
];

export default function HomePage() {
  return (
    <>
      <StandaloneRedirect />
      <main className="min-h-full bg-white text-slate-900">
        {/* ── HERO: navy con fondo líquido y logos ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#061624] via-[#0a2138] to-[#0e2f4d] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
          >
            <HeroPlexus className="h-full w-full" />
          </div>

          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center sm:py-24">
            {/* Logos: wordmark Cauce + chip Smart APR bien integrado */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/cauce-wordmark-light.svg"
              alt="Cauce"
              className="h-24 w-auto drop-shadow-[0_4px_24px_rgba(56,189,248,0.35)]"
            />
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">un producto de</span>
              <span className="text-sm font-bold text-white">Smart APR SpA</span>
            </div>

            <h1 className="mt-8 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              El sistema del agua potable rural:{" "}
              <span className="text-sky-300">socios, medidores y cobros</span> en
              un solo lugar
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-sky-100/80">
              Toma de lecturas casa por casa, tarifarios por tramo, cobros
              mensuales con boleta electrónica SII y reportes para la asamblea.
              Pensado para comités y cooperativas de Ñuble y Biobío.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <LandingCtas />
              <a
                href="#planes"
                className="rounded-xl border border-sky-300/40 px-6 py-3 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-400/10"
              >
                Ver planes y precios
              </a>
            </div>

            {/* Chips de confianza */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {[
                "Mes 1 gratis",
                "Migración $0",
                "Sin amarras ni multas",
                "Boletas SII",
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold text-sky-200"
                >
                  ✓ {chip}
                </span>
              ))}
            </div>            <p className="mt-6 text-sm text-sky-100/70">
              ¿Quieres el Plan Piloto para tu comité? Escríbenos a{" "}
              <a
                href="mailto:contacto@smartapr.cl?subject=Solicitud%20de%20Plan%20Piloto"
                className="font-semibold text-sky-300 underline decoration-sky-400/40 underline-offset-4 transition-colors hover:text-sky-200"
              >
                contacto@smartapr.cl
              </a>
            </p>
          </div>
        </section>

        {/* ── MÓDULOS ── */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">
            Todo lo que tu APR necesita,{" "}
            <span className="text-sky-700">en un solo sistema</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Desde la lectura en terreno hasta la boleta electrónica: cada paso
            del ciclo de agua queda registrado, cobrado y reportado.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/60 to-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-base font-semibold text-sky-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLANES ── */}
        <section id="planes" className="bg-gradient-to-b from-sky-50 to-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold">
              Un plan para el tamaño de tu APR
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
              Valores mensuales estables en pesos chilenos, según la cantidad de
              medidores activos.
              <strong>El primer mes es gratis</strong> en todos los planes.
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    plan.highlight
                      ? "border-sky-500 bg-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-500"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      El más completo
                    </span>
                  )}
                  <h3 className="text-sm font-bold uppercase tracking-wide text-sky-800">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{plan.range}</p>
                  <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
                    {plan.price}
                  </p>
                  <p className="text-xs text-slate-500">{plan.unit}</p>
                  <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    ✓ Mes 1 gratis
                  </span>
                </div>
              ))}
            </div>

            {/* Condiciones de contrato */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST.map((t) => (
                <div
                  key={t.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              Valores netos + IVA · Facturación mensual los primeros 5 días del
              mes · Capacitación presencial en Ñuble y Biobío: $95.000 (bonificada
              a $0 con plan anual)
            </p>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#061624] to-[#0e2f4d] py-20 text-center text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
          >
            <HeroPlexus className="h-full w-full" />
          </div>
          <div className="relative mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-bold">
              Empieza con el Plan Piloto: un mes gratis, sin amarras
            </h2>
            <p className="mt-4 text-sky-100/80">
              Migramos tus socios y deudas sin costo. Si el sistema no es para
              tu comité, te entregamos toda la base de datos en Excel y te vas
              sin pagar nada.
            </p>
            <a
              href="mailto:contacto@smartapr.cl?subject=Solicitud%20de%20Plan%20Piloto"
              className="mt-8 inline-block rounded-xl bg-sky-400 px-8 py-3.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-400/30 transition-colors hover:bg-sky-300"
            >
              Solicitar Plan Piloto
            </a>
            <p className="mt-4 text-sm text-sky-200/80">
              📞 +56 9 9093 2133 · contacto@smartapr.cl
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-[#061624] py-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/cauce-wordmark-light.svg"
            alt="Cauce"
            className="mx-auto h-10 w-auto opacity-90"
          />
          <p className="mt-3 text-xs text-slate-400">
            Cauce — un producto de{" "}
            <span className="font-semibold text-slate-300">Smart APR SpA</span>{" "}
            · cauce.smartapr.cl
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
            <Link href="/login" className="hover:text-slate-300">
              Ingresar
            </Link>
            <span>·</span>
            <Link href="/help" className="hover:text-slate-300">
              Documentación
            </Link>
            <span>·</span>
            <Link href="/politicas" className="hover:text-slate-300">
              Políticas
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
