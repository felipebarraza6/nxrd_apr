"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileText, Loader2, Play, Receipt } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PageBody, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { AnimatedOverlay } from "@/components/ui/animated-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/store/toast";
import { formatCLP } from "@/lib/utils";
import {
  createBillingRun,
  emitBillingRunDtes,
  fetchBillingRuns,
  type BillingRunRow,
  type DteEmitResult,
} from "@/lib/api/water";

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BillingPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(currentPeriod());
  const [dteResult, setDteResult] = useState<{
    run: BillingRunRow;
    result: DteEmitResult;
  } | null>(null);

  const runsQuery = useQuery({
    queryKey: ["water", "billing-runs"],
    queryFn: fetchBillingRuns,
  });

  const runs = runsQuery.data ?? [];

  const generateMutation = useMutation({
    mutationFn: () => createBillingRun(period),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ["water", "billing-runs"] });
      toast.success(
        `Corrida generada: ${run.orders_created} cargos por ${formatCLP(Number(run.total_amount))}`,
      );
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "No se pudo generar la corrida"),
  });

  const emitMutation = useMutation({
    mutationFn: (run: BillingRunRow) => emitBillingRunDtes(run.id),
    onSuccess: (result, run) => {
      queryClient.invalidateQueries({ queryKey: ["water", "billing-runs"] });
      setDteResult({ run, result });
      const ok = result.emitted.length;
      const fail = result.failed.length;
      toast.success(
        fail === 0
          ? `${ok} boletas emitidas al SII`
          : `${ok} boletas emitidas · ${fail} con error`,
      );
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Error al emitir boletas"),
  });

  const totalBilled = runs.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
  const totalCharges = runs.reduce((sum, r) => sum + (r.orders_created ?? 0), 0);

  return (
    <PageShell>
      <PageHeader
        title="Facturación de agua"
        icon={<Receipt className="h-5 w-5" />}
        subtitle="Genera los cargos del período desde las lecturas y emite las boletas al SII."
      />

      <PageBody className="gap-4">
        {/* Generar corrida */}
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Período a facturar
            </label>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 w-44"
            />
          </div>
          <Button
            className="h-9"
            disabled={generateMutation.isPending}
            isLoading={generateMutation.isPending}
            onClick={() => {
              const msg = `¿Generar los cargos de ${period}? Se crea un cargo por medidor con lectura y socio asignado, según el tarifario vigente.`;
              if (window.confirm(msg)) {
                generateMutation.mutate();
              }
            }}
          >
            <Play className="h-4 w-4" />
            Generar cargos del período
          </Button>
          <p className="text-xs text-muted-foreground">
            Idempotente: cada medidor se factura una sola vez por período.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatCard variant="compact" label="Corridas" value={runs.length} icon={Receipt} tone="primary" />
          <StatCard variant="compact" label="Cargos totales" value={totalCharges} icon={FileText} tone="muted" />
          <StatCard
            variant="compact"
            label="Total facturado"
            value={formatCLP(totalBilled)}
            icon={Receipt}
            tone="success"
          />
        </div>

        {runsQuery.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : runs.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sin corridas de cobro"
            description="Genera la corrida del período para crear los cargos de cada socio desde sus lecturas."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Período {run.period}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Tarifario: {run.tariff_name} · {run.orders_created} cargos
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold tabular-nums">
                      {formatCLP(Number(run.total_amount))}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      disabled={emitMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Emitir boletas SII para los cargos de ${run.period} que no tengan boleta?`,
                          )
                        ) {
                          emitMutation.mutate(run);
                        }
                      }}
                    >
                      {emitMutation.isPending && emitMutation.variables?.id === run.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      Emitir boletas
                    </Button>
                  </div>
                </div>

                {run.items.length > 0 && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[36rem] text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Medidor</th>
                          <th className="px-3 py-2 font-medium">Socio</th>
                          <th className="px-3 py-2 text-right font-medium">Consumo</th>
                          <th className="px-3 py-2 text-right font-medium">Cargo</th>
                          <th className="px-3 py-2 text-center font-medium">Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {run.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 font-medium">{item.meter_number}</td>
                            <td className="px-3 py-2">{item.client_name ?? "—"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {item.consumed_m3} m³
                            </td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">
                              {formatCLP(Number(item.amount))}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  item.order_payment_status === "PAID"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-amber-500/10 text-amber-600"
                                }`}
                              >
                                {item.order_payment_status === "PAID" ? "Pagado" : "Pendiente"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PageBody>

      {/* Resultado de emisión */}
      {dteResult && (
        <AnimatedOverlay
          open
          onClose={() => setDteResult(null)}
          zIndex="z-[80]"
          panelClassName="flex items-center justify-center p-4"
        >
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl">
            <h3 className="text-base font-semibold">
              Emisión SII · período {dteResult.run.period}
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-xs">
              {dteResult.result.emitted.length > 0 && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="font-medium text-emerald-600">
                    {dteResult.result.emitted.length} boletas emitidas
                  </p>
                  <ul className="mt-1 text-muted-foreground">
                    {dteResult.result.emitted.map((e, i) => (
                      <li key={i}>
                        {e.meter}: folio {e.folio ?? "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dteResult.result.skipped.length > 0 && (
                <p className="text-muted-foreground">
                  {dteResult.result.skipped.length} ya tenían boleta.
                </p>
              )}
              {dteResult.result.failed.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="flex items-center gap-1.5 font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {dteResult.result.failed.length} fallaron
                  </p>
                  <ul className="mt-1 max-h-32 overflow-y-auto text-muted-foreground">
                    {dteResult.result.failed.map((f, i) => (
                      <li key={i}>
                        {f.meter}: {f.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => setDteResult(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </AnimatedOverlay>
      )}
    </PageShell>
  );
}
