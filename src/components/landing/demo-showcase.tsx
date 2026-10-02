"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Droplets,
  Gauge,
  NotebookPen,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { fetchCauceDemoKpis } from "@/lib/api/cauce-demo";
import {
  CAUCE_DEMO_KPI_FALLBACK,
  demoSampleReading,
  readDemoKpiCache,
  resolveDemoKpis,
  writeDemoKpiCache,
  type CauceDemoKpis,
} from "@/lib/cauce-demo";
import { formatCLP, cn } from "@/lib/utils";

/**
 * Showcase "Así se ve Cauce" con componentes reales (StatCard) y KPIs públicos.
 * Un fetch por carga de página; cache sessionStorage; fallback estático.
 */
function formatM3(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("es-CL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function DemoShowcase() {
  // El HTML estático se genera con el fallback: el primer render del cliente
  // debe coincidir (si no, React #418). La cache de sessionStorage se lee
  // recién después del montaje.
  const [kpis, setKpis] = useState<CauceDemoKpis>(CAUCE_DEMO_KPI_FALLBACK);
  const [source, setSource] = useState<"live" | "cache" | "fallback">("fallback");

  useEffect(() => {
    let cancelled = false;
    const cached = readDemoKpiCache();
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- cache sessionStorage solo tras montar (hidratación sin mismatch)
      setKpis(cached);
      setSource("cache");
    }
    fetchCauceDemoKpis()
      .then((data) => {
        if (cancelled) return;
        writeDemoKpiCache(data);
        const resolved = resolveDemoKpis(data, cached, false);
        setKpis(resolved.data);
        setSource(resolved.source);
      })
      .catch(() => {
        if (cancelled) return;
        const resolved = resolveDemoKpis(null, cached, true);
        setKpis(resolved.data);
        setSource(resolved.source);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sample = demoSampleReading(kpis);
  const maxM3 = useMemo(
    () =>
      Math.max(
        1,
        ...kpis.consumption_by_sector.map((s) => Number(s.m3) || 0),
      ),
    [kpis.consumption_by_sector],
  );

  return (
    <section id="demo-showcase" className="relative bg-papel text-tinta">
      <div className="puntos-oscura pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-36">
        <div className="flex items-baseline justify-between border-t-2 border-tinta pt-4">
          <p className="font-accent text-[11px] uppercase tracking-[0.28em]">
            02 — Así se ve Cauce
          </p>
          <p className="font-accent hidden text-[11px] uppercase tracking-[0.28em] text-tinta/50 md:block">
            {kpis.branch.name}
            {source === "fallback" ? " · datos de ejemplo" : ""}
          </p>
        </div>
        <h2 className="mt-14 max-w-3xl font-heading text-[clamp(2.1rem,4.8vw,4.2rem)] font-bold leading-[1.02] tracking-[-0.02em]">
          La misma interfaz que usa tu{" "}
          <span className="text-azul">directiva.</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-tinta/60 md:text-base">
          KPIs del período {kpis.period}
          {kpis.branch.commune ? ` · ${kpis.branch.commune}` : ""}
          {kpis.branch.region ? `, ${kpis.branch.region}` : ""}. Componentes
          reales de la app — no son capturas.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            variant="compact"
            label="Socios"
            value={kpis.socios}
            icon={Users}
            tone="primary"
          />
          <StatCard
            variant="compact"
            label="Medidores"
            value={kpis.meters}
            icon={Gauge}
            tone="muted"
          />
          <StatCard
            variant="compact"
            label="Lecturas"
            value={kpis.readings_this_month}
            icon={NotebookPen}
            tone="muted"
          />
          <StatCard
            variant="compact"
            label="m³ mes"
            value={kpis.m3_this_month.toLocaleString("es-CL")}
            icon={Droplets}
            tone="primary"
          />
          <StatCard
            variant="compact"
            label="Cobrado"
            value={formatCLP(kpis.collected.amount_clp)}
            icon={Wallet}
            tone="success"
            sub={`${kpis.collected.count} pagos`}
          />
          <StatCard
            variant="compact"
            label="Pendiente"
            value={formatCLP(kpis.pending.amount_clp)}
            icon={Receipt}
            tone="warning"
            sub={`${kpis.pending.count} cargos`}
          />
        </div>

        {/* Consumo por sector — barras simples reutilizando tokens */}
        <div className="mt-10 border border-tinta/15 bg-white/70 p-5 backdrop-blur-sm md:p-6">
          <p className="font-accent text-[11px] uppercase tracking-[0.18em] text-tinta/50">
            Consumo por sector
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {kpis.consumption_by_sector.map((row) => (
              <div key={row.sector} className="grid grid-cols-12 items-center gap-2">
                <p className="col-span-3 truncate font-heading text-sm font-semibold md:col-span-2">
                  {row.sector}
                </p>
                <div className="col-span-6 h-2 bg-tinta/10 md:col-span-7">
                  <div
                    className="h-full bg-azul transition-[width] duration-500"
                    style={{ width: `${(Number(row.m3) / maxM3) * 100}%` }}
                  />
                </div>
                <p className="col-span-3 text-right font-accent text-[11px] tabular-nums text-tinta/60">
                  {Number(row.m3).toLocaleString("es-CL")} m³
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Snippet tabla medidores/lecturas */}
          <div className="border border-tinta/15 bg-white/70 p-5 backdrop-blur-sm">
            <p className="font-accent text-[11px] uppercase tracking-[0.18em] text-tinta/50">
              Lecturas del período
            </p>
            <table className="mt-4 w-full text-left text-sm">
              <thead className="font-accent text-[10px] uppercase tracking-[0.14em] text-tinta/45">
                <tr>
                  <th className="pb-2 font-medium">Sector</th>
                  <th className="pb-2 font-medium">Socios</th>
                  <th className="pb-2 text-right font-medium">Lecturas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta/10">
                {kpis.consumption_by_sector.slice(0, 4).map((row) => (
                  <tr key={row.sector}>
                    <td className="py-2.5 font-medium">{row.sector}</td>
                    <td className="py-2.5 tabular-nums text-tinta/60">{row.socios}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {row.readings}/{row.socios}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card estilo POS de lectura — lectura real del demo (o seed) */}
          <div className="border-2 border-azul/30 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-azul/10 px-3 py-1 text-xs font-semibold text-azul">
                {sample.meter_number}
              </span>
              <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-tinta/45">
                POS lectura · {sample.period}
              </span>
            </div>
            <p className="mt-4 font-heading text-2xl font-bold tracking-[-0.02em]">
              {sample.client_name}
            </p>
            <p className="mt-1 text-sm text-tinta/55">
              {[sample.sector ? `Sector ${sample.sector}` : null, sample.address]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center">
              <div className="bg-tinta/5 p-3">
                <p className="font-accent text-[10px] uppercase tracking-[0.14em] text-tinta/45">
                  Anterior
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {formatM3(sample.previous_reading)}
                </p>
              </div>
              <div className={cn("bg-azul/10 p-3")}>
                <p className="font-accent text-[10px] uppercase tracking-[0.14em] text-azul">
                  Consumo
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-azul">
                  {formatM3(sample.consumed_m3)}
                </p>
              </div>
            </div>
            <div className="mt-4 h-12 border border-tinta/15 bg-papel text-center font-heading text-2xl font-bold leading-[3rem] tabular-nums text-tinta/30">
              {formatM3(sample.current_reading)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
