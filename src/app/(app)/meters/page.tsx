"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Droplets, Gauge, Pencil, Plus, Search, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PageBody, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { AnimatedOverlay } from "@/components/ui/animated-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/store/toast";
import {
  createMeter,
  fetchMeters,
  updateMeter,
  type WaterMeter,
} from "@/lib/api/water";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activo",
  RETIRED: "Retirado",
  DAMAGED: "Dañado",
};

export default function MetersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<WaterMeter | null>(null);
  const [open, setOpen] = useState(false);

  const clientsQuery = useQuery({
    queryKey: ["customers", "meter-picker"],
    queryFn: async () => {
      const { searchCustomers } = await import("@/lib/api/customers");
      return searchCustomers("");
    },
    staleTime: 60_000,
  });

  const metersQuery = useQuery({
    queryKey: ["water", "meters", search],
    queryFn: () => fetchMeters({ search: search.trim() || undefined }),
    placeholderData: keepPreviousData,
  });

  const meters = metersQuery.data ?? [];
  const activeCount = meters.filter((m) => m.status === "ACTIVE").length;

  const save = useMutation({
    mutationFn: (payload: Partial<WaterMeter>) =>
      editing ? updateMeter(editing.id, payload) : createMeter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water", "meters"] });
      setOpen(false);
      setEditing(null);
      toast.success(editing ? "Medidor actualizado" : "Medidor creado");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "No se pudo guardar"),
  });

  return (
    <PageShell>
      <PageHeader
        title="Puntos de medición"
        icon={<Gauge className="h-5 w-5" />}
        subtitle="Medidores del APR asignados a cada socio, con su último consumo."
        actions={
          <Button
            className="h-9"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo medidor
          </Button>
        }
      />

      <PageBody className="gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatCard variant="compact" label="Medidores" value={meters.length} icon={Gauge} tone="primary" />
          <StatCard variant="compact" label="Activos" value={activeCount} icon={Droplets} tone="success" />
          <StatCard
            variant="compact"
            label="Sin socio"
            value={meters.filter((m) => !m.client).length}
            icon={Droplets}
            tone="warning"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, socio o sector…"
              className="h-8 pl-8 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            containerClassName="w-40 shrink-0"
            className="h-8 text-xs"
          >
            <option value="">Estado: todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="RETIRED">Retirados</option>
            <option value="DAMAGED">Dañados</option>
          </Select>
        </div>

        {metersQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : meters.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title="Sin medidores"
            description="Registra el primer punto de medición del APR y asígnalo a un socio."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                Crear medidor
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {meters
              .filter((m) => !statusFilter || m.status === statusFilter)
              .map((meter) => (
                <div
                  key={meter.id}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {meter.number}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {meter.client_name ?? "Sin socio asignado"}
                          {meter.sector ? ` · ${meter.sector}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            meter.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {STATUS_LABEL[meter.status]}
                        </span>
                        <button
                          type="button"
                          title="Editar medidor"
                          onClick={() => {
                            setEditing(meter);
                            setOpen(true);
                          }}
                          className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-muted/40 p-2.5 text-xs">
                      {meter.last_reading ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            Última lectura ({meter.last_reading.period})
                          </span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {meter.last_reading.consumed_m3} m³
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Sin lecturas registradas
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {meter.readings_count} lectura{meter.readings_count === 1 ? "" : "s"} ·
                    instalación{" "}
                    {meter.installed_at
                      ? new Date(meter.installed_at).toLocaleDateString("es-CL")
                      : "sin fecha"}
                  </p>
                </div>
              ))}
          </div>
        )}
      </PageBody>

      <MeterModal
        open={open}
        editing={editing}
        clients={(clientsQuery.data ?? []).map((c) => ({
          value: String(c.id),
          label: c.name ?? `Socio #${c.id}`,
        }))}
        saving={save.isPending}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={(payload) => save.mutate(payload)}
      />
    </PageShell>
  );
}

function MeterModal({
  open,
  editing,
  clients,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: WaterMeter | null;
  clients: Array<{ value: string; label: string }>;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Partial<WaterMeter>) => void;
}) {
  const [number, setNumber] = useState(editing?.number ?? "");
  const [clientId, setClientId] = useState<string>(editing?.client ? String(editing.client) : "");
  const [sector, setSector] = useState(editing?.sector ?? "");
  const [initial, setInitial] = useState(String(editing?.initial_reading ?? "0"));
  const [status, setStatus] = useState<WaterMeter["status"]>(editing?.status ?? "ACTIVE");

  // Reset al reabrir con otro medidor
  const [key, setKey] = useState<string | null>(null);
  const openKey = open ? editing?.id ?? "new" : null;
  if (key !== openKey) {
    setKey(openKey);
    setNumber(editing?.number ?? "");
    setClientId(editing?.client ? String(editing.client) : "");
    setSector(editing?.sector ?? "");
    setInitial(String(editing?.initial_reading ?? "0"));
    setStatus((editing?.status ?? "ACTIVE") as WaterMeter["status"]);
  }

  return (
    <AnimatedOverlay
      open={open}
      onClose={onClose}
      zIndex="z-[70]"
      panelClassName="flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6">
        <h2 className="text-base font-semibold">
          {editing ? "Editar medidor" : "Nuevo medidor"}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!number.trim()) return;
            onSave({
              number: number.trim(),
              client: clientId ? Number(clientId) : null,
              sector: sector.trim(),
              initial_reading: Number(initial) || 0,
              status: status as WaterMeter["status"],
            });
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Número *</label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="M-001"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Socio</label>
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="text-xs">
              <option value="">Sin socio asignado</option>
              {clients.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Sector / ruta</label>
            <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Alto" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Lectura inicial</label>
              <Input type="number" value={initial} onChange={(e) => setInitial(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as WaterMeter["status"])} className="text-xs">
                <option value="ACTIVE">Activo</option>
                <option value="RETIRED">Retirado</option>
                <option value="DAMAGED">Dañado</option>
              </Select>
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!number.trim() || saving} isLoading={saving}>
              {editing ? "Guardar cambios" : "Crear medidor"}
            </Button>
          </div>
        </form>
      </div>
    </AnimatedOverlay>
  );
}
