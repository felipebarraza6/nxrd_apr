import type { Metadata } from "next";
import Link from "next/link";
import { StandaloneRedirect } from "@/components/standalone-redirect";

export const metadata: Metadata = {
  title: "Cauce — Gestión de APR: socios, medidores y cobros de agua",
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
    title: "Lecturas y tarifarios",
    description:
      "Captura de lecturas por ruta o carga masiva desde planilla. Tarifarios con cargo fijo y tramos por m³, con vigencias.",
  },
  {
    title: "Cobros con boleta electrónica",
    description:
      "Corrida de cobro por período: genera los cargos de cada socio, los cobra en oficina o por transferencia y emite boletas al SII.",
  },
  {
    title: "Dinero y caja",
    description:
      "Caja de oficina con arqueo, ingresos y egresos del comité, conciliaciones bancarias e informes listos para la asamblea.",
  },
];

export default function HomePage() {
  return (
    <>
      <StandaloneRedirect />
      <main className="min-h-full bg-gradient-to-b from-sky-950 via-sky-900 to-cyan-950 text-sky-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
          <p className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-sky-300">
            nxrd_apr
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            El sistema del agua potable rural:{" "}
            <span className="text-sky-300">socios, medidores y cobros</span> en un
            solo lugar
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-sky-100/80">
            Gestiona tu APR completa: lecturas de medidores, tarifarios por
            tramo, cobros mensuales con boleta electrónica SII, caja de oficina
            e informes para la asamblea.
          </p>

          <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-sky-400/20 bg-sky-950/60 p-6"
              >
                <h2 className="text-base font-semibold text-sky-200">
                  {f.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-sky-100/70">
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-sky-400 px-6 py-3 text-sm font-semibold text-sky-950 transition-colors hover:bg-sky-300"
            >
              Entrar al sistema
            </Link>
            <Link
              href="/help"
              className="rounded-xl border border-sky-400/40 px-6 py-3 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-400/10"
            >
              Documentación
            </Link>
          </div>

          <p className="mt-16 text-xs text-sky-100/40">
            Cauce (nxrd_apr) — producto en construcción para comités y cooperativas de
            agua potable rural
          </p>
        </div>
      </main>
    </>
  );
}
