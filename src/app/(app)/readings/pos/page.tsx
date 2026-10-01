"use client";

/**
 * POS de lectura — captura casa por casa.
 *
 * Como el POS de ventas pero para el medidor: elegís la ruta, y avanza
 * medidor a medidor con teclado (Enter = registrar y seguir). Al terminar
 * la ruta muestra el resumen y deja ir directo a facturar el período.
 */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  ChevronsRight,
  Gauge,
  SkipForward,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PageBody, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/store/toast";
import { createReading, fetchMeters, fetchReadings } from "@/lib/api/water";

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodFromQuery(): string {
  if (typeof window === "undefined") return currentPeriod();
  const q = new URLSearchParams(window.location.search).get("period");
  return q && /^\d{4}-\d{2}$/.test(q) ? q : currentPeriod();
}

export default function ReadingPosPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [period, setPeriod] = useState(periodFromQuery);
  const [sector, setSector] = useState("");
  const [value, setValue] = useState("");
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

  const metersQuery = useQuery({
    queryKey: ["water", "meters", "pos"],
    queryFn: () => fetchMeters(),
    staleTime: 60_000,
  });
  const readingsQuery = useQuery({
    queryKey: ["water", "readings", period],
    queryFn: () => fetchReadings({ period }),
    placeholderData: keepPreviousData,
  });

  const meters = useMemo(() => metersQuery.data ?? [], [metersQuery.data]);
  const readings = useMemo(() => readingsQuery.data ?? [], [readingsQuery.data]);
  const readingByMeter = useMemo(() => {
    const map = new Map<string, (typeof readings)[number]>();
    for (const r of readings) map.set(r.meter, r);
    return map;
  }, [readings]);

  const sectors = useMemo(
    () =>
      Array.from(
        new Set(meters.filter((m) => m.status === "ACTIVE" && m.sector).map((m) => m.sector)),
      ).sort(),
    [meters],
  );

  const routeMeters = useMemo(
    () =>
      meters.filter(
        (m) =>
          m.status === "ACTIVE" &&
          m.client &&
          (!sector || m.sector === sector),
      ),
    [meters, sector],
  );

  const pending = routeMeters.filter(
    (m) => !readingByMeter.has(m.id) && !skipped.has(m.id),
  );
  const current = pending[0] ?? null;
  const completed = routeMeters.length - pending.length;
  const totalConsumed = routeMeters.reduce(
    (sum, m) => sum + Number(readingByMeter.get(m.id)?.consumed_m3 ?? 0),
    0,
  );

  const saveMutation = useMutation({
    mutationFn: (vars: { meterId: string; value: string }) =>
      createReading({
        meter: vars.meterId,
        period,
        current_reading: vars.value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water", "readings"] });
      queryClient.invalidateQueries({ queryKey: ["water", "meters"] });
      setValue("");
      inputRef.current?.focus();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "No se pudo registrar la lectura"),
  });

  const sectorsLoading = metersQuery.isLoading;

  return (
    <PageShell>
      <PageHeader
        title="POS de lectura — casa por casa"
        icon={<Gauge className="h-5 w-5" />}
        subtitle={`Período ${period} · tomá la lectura medidor a medidor, Enter avanza al siguiente.`}
        actions={
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            containerClassName="w-36"
            className="h-9 text-xs"
          >
            <option value={currentPeriod()}>{currentPeriod()}</option>
            <option value={prevPeriod()}>{prevPeriod()}</option>
          </Select>
        }
      />

      <PageBody className="gap-4">
        {/* Selector de ruta */}
        {sectors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Ruta:</span>
            <Button
              size="sm"
              variant={sector === "" ? "default" : "outline"}
              className="h-7"
              onClick={() => setSector("")}
            >
              Todas
            </Button>
            {sectors.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sector === s ? "default" : "outline"}
                className="h-7"
                onClick={() => setSector(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        )}

        {/* Progreso */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Hechas</p>
            <p className="text-xl font-semibold tabular-nums text-emerald-500">{completed}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pendientes</p>
            <p className="text-xl font-semibold tabular-nums text-amber-500">{pending.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">m³ del período</p>
            <p className="text-xl font-semibold tabular-nums">{totalConsumed}</p>
          </div>
        </div>

        {sectorsLoading ? (
          <Skeleton className="h-72 rounded-2xl" />
        ) : routeMeters.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title="No hay medidores activos con socio en esta ruta"
            description="Asigná socios a los medidores en Puntos de medición para poder leerlos."
            action={
              <Link
                href="/meters"
                className="inline-flex h-9 items-center justify-center rounded-md bg-azul px-4 text-sm font-medium text-white hover:bg-azul-deep"
              >
                Ir a medidores
              </Link>
            }
          />
        ) : done || !current ? (
          /* ── Ruta completa ── */
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <h2 className="text-xl font-semibold">¡Ruta completada!</h2>
            <p className="text-sm text-muted-foreground">
              {completed} lecturas registradas · {totalConsumed} m³ en el período {period}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSkipped(new Set());
                  setDone(false);
                }}
              >
                Repasar saltadas
              </Button>
              <a
                href="/billing"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ChevronsRight className="h-4 w-4" />
                Ir a facturar el período
              </a>
            </div>
          </div>
        ) : (
          /* ── Medidor actual ── */
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-2xl border-2 border-primary/30 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {current.number}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {completed + 1} de {routeMeters.length}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold leading-tight">
                  {current.client_name ?? "Sin socio"}
                </p>
              </div>
              {current.sector && (
                <p className="mt-1 text-sm text-muted-foreground">Sector: {current.sector}</p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Lectura anterior
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {Number(
                      readingByMeter.get(current.id)?.previous_reading ??
                        current.last_reading?.current_reading ??
                        current.initial_reading ??
                        0,
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-primary">Consumo</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                    {value !== "" && Number(value) >= 0
                      ? Math.max(0, Number(value) - Number(current.last_reading?.current_reading ?? current.initial_reading ?? 0))
                      : "—"}
                  </p>
                </div>
              </div>

              <form
                className="mt-5 flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (value === "" || saveMutation.isPending) return;
                  saveMutation.mutate({ meterId: current.id, value });
                }}
              >
                <label className="text-xs font-medium text-muted-foreground">
                  Lectura actual (m³) — Enter para registrar y avanzar
                </label>
                <Input
                  ref={inputRef}
                  autoFocus
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                  className="h-16 text-center text-4xl font-bold tabular-nums"
                />
                {value !== "" && Number(value) < Number(current.last_reading?.current_reading ?? current.initial_reading ?? 0) && (
                  <p className="text-xs font-medium text-destructive">
                    La lectura es menor que la anterior — revisá el número.
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={value === "" || saveMutation.isPending}
                    isLoading={saveMutation.isPending}
                  >
                    Registrar y siguiente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    title="Saltar y volver al final"
                    onClick={() => {
                      setSkipped((prev) => new Set(prev).add(current.id));
                      setValue("");
                    }}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>

            {/* Cola de la ruta */}
            {pending.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {pending.slice(1, 8).map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {m.number} · {m.client_name}
                  </span>
                ))}
                {pending.length > 8 && (
                  <span className="rounded-full px-2.5 py-1 text-[11px] text-muted-foreground">
                    +{pending.length - 8} más
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </PageBody>
    </PageShell>
  );
}

function prevPeriod(): string {
  const d = new Date();
  const m = d.getMonth(); // 0-based
  const y = d.getFullYear();
  const pm = m === 0 ? 12 : m;
  const py = m === 0 ? y - 1 : y;
  return `${py}-${String(pm).padStart(2, "0")}`;
}
