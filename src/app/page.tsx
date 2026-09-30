import type { Metadata } from "next";
import Link from "next/link";
import { StandaloneRedirect } from "@/components/standalone-redirect";

export const metadata: Metadata = {
  title: "Cauce by Smart APR — Gestión de APR: socios, medidores y cobros",
  description:
    "Sistema para Agua Potable Rural: socios, puntos de medición, lecturas, tarifarios por tramo, cobros con boleta electrónica SII, caja de oficina e informes.",
};

const FEATURES = [
  {
    title: "Socios y medidores",
    description:
      "Ficha completa por socio con su punto de medición: número de medidor, sector, histórico de consumo y deuda.",
  },
  {
    title: "POS de lectura casa por casa",
    description:
      "El lector recorre la ruta y toma la lectura medidor a medidor, como un POS: rápido, con consumo calculado al instante.",
  },
  {
    title: "Tarifarios por tramo",
    description:
      "Cargo fijo mensual + tramos por m³ con vigencias. El sistema calcula el cargo de cada socio automáticamente.",
  },
  {
    title: "Cobros con boleta electrónica",
    description:
      "Corrida de cobro del período: genera los cargos, cobra en oficina o por transferencia y emite boletas al SII.",
  },
  {
    title: "Caja e informes",
    description:
      "Arqueo de caja, ingresos y egresos del comité, conciliaciones bancarias e informes listos para la asamblea.",
  },
  {
    title: "Materiales y compras",
    description:
      "Medidores de repuesto, cloro y cañerías: inventario por bodega y órdenes de compra a proveedores.",
  },
];

export default function HomePage() {
  return (
    <>
      <StandaloneRedirect />
      <main className="min-h-full bg-gradient-to-b from-white via-sky-50 to-sky-100 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
          {/* Marca */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/cauce-wordmark.svg"
            alt="Cauce"
            className="h-20 w-auto"
          />
          <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
            un producto de
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/smartapr-logo.jpg"
              alt="Smart APR SpA"
              className="h-10 w-auto rounded-lg border border-sky-200 bg-white object-contain p-1 shadow-sm"
            />
            Smart APR SpA
          </p>

          <h1 className="mt-8 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            El sistema del agua potable rural:{" "}
            <span className="text-sky-700">socios, medidores y cobros</span> en un
            solo lugar
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            Gestiona tu APR completa: lecturas de medidores casa por casa,
            tarifarios por tramo, cobros mensuales con boleta electrónica SII,
            caja de oficina e informes para la asamblea.
          </p>

          <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm"
              >
                <h2 className="text-base font-semibold text-sky-800">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-800"
            >
              Entrar al sistema
            </Link>
            <Link
              href="/help"
              className="rounded-xl border border-sky-300 px-6 py-3 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-100"
            >
              Documentación
            </Link>
          </div>

          <p className="mt-16 text-xs text-slate-400">
            Cauce — un producto de Smart APR SpA · cauce.smartapr.cl
          </p>
        </div>
      </main>
    </>
  );
}
