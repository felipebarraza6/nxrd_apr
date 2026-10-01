"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Gauge,
  AlertCircle,
  CheckCircle2,
  Download,
  NotebookPen,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PageBody, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedOverlay } from "@/components/ui/animated-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/store/toast";
import {
  createReading,
  fetchMeters,
  fetchReadings,
  importReadingsCsv,
  readingsCsvTemplate,
  type CsvImportResult,
} from "@/lib/api/water";

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReadingsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(currentPeriod());
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);

  const metersQuery = useQuery({
    queryKey: ["water", "meters", ""],
    queryFn: () => fetchMeters(),
    staleTime: 60_000,
  });

  const readingsQuery = useQuery({
    queryKey: ["water", "readings", period],
    queryFn: () => fetchReadings({ period }),
    placeholderData: keepPreviousData,
  });

  const readings = useMemo(
    () => readingsQuery.data ?? [],
    [readingsQuery.data],
  );
  const meters = useMemo(() => metersQuery.data ?? [], [metersQuery.data]);

  // Medidores activos del período: con lectura o pendientes
  const readingsByMeter = useMemo(() => {
    const map = new Map<string, (typeof readings)[number]>();
    for (const r of readings) map.set(r.meter, r);
    return map;
  }, [readings]);

  const activeMeters = meters.filter((m) => m.status === "ACTIVE");
  const pendingMeters = activeMeters.filter((m) => !readingsByMeter.has(m.id));
  const totalConsumed = readings.reduce(
    (sum, r) => sum + Number(r.consumed_m3 || 0),
    0,
  );

  const createMutation = useMutation({
    mutationFn: createReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water", "readings"] });
      toast.success("Lectura registrada");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "No se pudo registrar"),
  });

  const importMutation = useMutation({
    mutationFn: ({ file, periodDefault }: { file: File; periodDefault?: string }) =>
      importReadingsCsv(file, periodDefault),
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["water", "readings"] });
      queryClient.invalidateQueries({ queryKey: ["water", "meters"] });
      if (result.errors.length === 0) {
        toast.success(`${result.created.length} lecturas importadas`);
      }
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "No se pudo importar"),
  });

  return (
    <PageShell>
      <PageHeader
        title="Lecturas de medidores"
        icon={<NotebookPen className="h-5 w-5" />}
        subtitle={`Período ${period}: captura por medidor y carga masiva desde planilla.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9"
              onClick={() => router.push('/readings/pos?period=' + period)}
            >
              <Gauge className="h-4 w-4" />
              Modo casa por casa
            </Button>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => {
                const blob = readingsCsvTemplate();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "plantilla_lecturas.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4" />
              Plantilla
            </Button>
            <Button
              className="h-9"
              onClick={() => {
                setImportResult(null);
                setImportOpen(true);
              }}
            >
              <Upload className="h-4 w-4" />
              Carga masiva
            </Button>
          </div>
        }
      />

      <PageBody className="gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Período</p>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lecturas</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{readings.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pendientes</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-amber-500">
              {pendingMeters.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Consumo total</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {totalConsumed.toLocaleString("es-CL")} m³
            </p>
          </div>
        </div>

        {readingsQuery.isLoading || metersQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : activeMeters.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="Sin medidores activos"
            description="Registra medidores en Puntos de medición para poder tomar lecturas."
            action={
              <Link
                href="/meters"
                className="inline-flex h-9 items-center justify-center rounded-md bg-azul px-4 text-sm font-medium text-white hover:bg-azul-deep"
              >
                Ir a medidores
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeMeters.map((meter) => {
              const reading = readingsByMeter.get(meter.id);
              return (
                <div
                  key={meter.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{meter.number}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {meter.client_name ?? "Sin socio"}
                        {meter.sector ? ` · ${meter.sector}` : ""}
                      </p>
                    </div>
                    {reading ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Leído
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        Pendiente
                      </span>
                    )}
                  </div>

                  {reading ? (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-[10px] text-muted-foreground">Anterior</p>
                        <p className="font-semibold tabular-nums">{reading.previous_reading}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-[10px] text-muted-foreground">Actual</p>
                        <p className="font-semibold tabular-nums">{reading.current_reading}</p>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2">
                        <p className="text-[10px] text-primary">Consumo</p>
                        <p className="font-semibold tabular-nums text-primary">
                          {reading.consumed_m3} m³
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ReadingQuickForm
                      meterId={meter.id}
                      previous={Number(meter.last_reading?.current_reading ?? meter.initial_reading)}
                      saving={createMutation.isPending}
                      onSubmit={(value) =>
                        createMutation.mutate({
                          meter: meter.id,
                          period,
                          current_reading: value,
                        })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageBody>

      {/* Modal de carga masiva */}
      <AnimatedOverlay
        open={importOpen}
        onClose={() => setImportOpen(false)}
        zIndex="z-[75]"
        panelClassName="flex items-end justify-center p-0 sm:items-center sm:p-4"
      >
        <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6">
          <h2 className="text-base font-semibold">Carga masiva de lecturas</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            CSV con columnas <code className="rounded bg-muted px-1">meter_number</code>,{" "}
            <code className="rounded bg-muted px-1">period</code> y{" "}
            <code className="rounded bg-muted px-1">current_reading</code>. Usa la plantilla
            para el formato correcto.
          </p>

          <CsvImportForm
            defaultPeriod={period}
            importing={importMutation.isPending}
            onImport={(file, periodDefault) =>
              importMutation.mutate({ file, periodDefault })
            }
          />

          {importResult && (
            <div className="mt-4 flex flex-col gap-2 text-xs">
              {importResult.created.length > 0 && (
                <p className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {importResult.created.length} lecturas creadas
                </p>
              )}
              {importResult.skipped.length > 0 && (
                <p className="text-muted-foreground">
                  {importResult.skipped.length} filas saltadas (ya leídas o medidor inactivo).
                </p>
              )}
              {importResult.errors.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="flex items-center gap-1.5 font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {importResult.errors.length} errores
                  </p>
                  <ul className="mt-1.5 max-h-40 overflow-y-auto pr-2">
                    {importResult.errors.map((e, i) => (
                      <li key={i} className="text-muted-foreground">
                        Fila {e.row}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </AnimatedOverlay>
    </PageShell>
  );
}

function ReadingQuickForm({
  meterId,
  previous,
  saving,
  onSubmit,
}: {
  meterId: string;
  previous: number;
  saving: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const num = Number(value);
  const consumed = value !== "" && num >= previous ? num - previous : null;

  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value === "") return;
        onSubmit(value);
        setValue("");
      }}
    >
      <Input
        ref={ref}
        type="number"
        step="0.01"
        min={previous}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`≥ ${previous}`}
        className="h-8 flex-1 text-xs"
        data-meter={meterId}
      />
      {consumed !== null && (
        <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
          {consumed} m³
        </span>
      )}
      <Button type="submit" size="sm" className="h-8 shrink-0" disabled={value === "" || saving} isLoading={saving}>
        Registrar
      </Button>
    </form>
  );
}

function CsvImportForm({
  defaultPeriod,
  importing,
  onImport,
}: {
  defaultPeriod: string;
  importing: boolean;
  onImport: (file: File, periodDefault?: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [periodDefault, setPeriodDefault] = useState(defaultPeriod);

  return (
    <form
      className="mt-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (file) onImport(file, periodDefault);
      }}
    >
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">
        <Upload className="h-4 w-4" />
        {file ? file.name : "Elegir archivo CSV…"}
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Período por defecto (si el CSV no trae columna period)
        </label>
        <Input
          type="month"
          value={periodDefault}
          onChange={(e) => setPeriodDefault(e.target.value)}
          className="text-xs"
        />
      </div>
      <Button type="submit" size="sm" disabled={!file || importing} isLoading={importing}>
        Importar lecturas
      </Button>
    </form>
  );
}
