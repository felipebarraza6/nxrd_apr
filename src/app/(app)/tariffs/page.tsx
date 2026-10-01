"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PageBody, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedOverlay } from "@/components/ui/animated-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/store/toast";
import { formatCLP } from "@/lib/utils";
import {
  createTariff,
  fetchTariffs,
  type WaterTariff,
  type WaterTariffBlock,
} from "@/lib/api/water";

export default function TariffsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const tariffsQuery = useQuery({
    queryKey: ["water", "tariffs"],
    queryFn: fetchTariffs,
  });

  const tariffs = [...(tariffsQuery.data ?? [])].sort((a, b) =>
    b.effective_from.localeCompare(a.effective_from),
  );

  return (
    <PageShell>
      <PageHeader
        title="Tarifarios"
        icon={<ScrollText className="h-5 w-5" />}
        subtitle="Cargo fijo mensual + tramos por m³ (solo lectura). El más reciente según su vigencia es el que aplica."
        actions={
          <Button className="h-9" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo tarifario
          </Button>
        }
      />

      <PageBody className="gap-4">
        {tariffsQuery.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : tariffs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Sin tarifarios"
            description="Crea el tarifario del APR (nombre, cargo fijo y vigencia). Los tramos por m³ hoy solo se configuran en backend."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                Crear tarifario
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {tariffs.map((tariff, idx) => (
              <div
                key={tariff.id}
                className={`rounded-2xl border p-4 ${
                  idx === 0
                    ? "border-primary/40 bg-primary/[0.03]"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{tariff.name}</h3>
                      {idx === 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Vigente
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Vigente desde{" "}
                      {new Date(tariff.effective_from).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    Fijo: {formatCLP(Number(tariff.fixed_charge))}
                  </p>
                </div>

                {(tariff.blocks?.length ?? 0) > 0 ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Tramo (solo lectura)</th>
                          <th className="px-3 py-2 text-right font-medium">Precio por m³</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {tariff.blocks.map((block: WaterTariffBlock) => (
                          <tr key={block.id}>
                            <td className="px-3 py-2 tabular-nums">
                              {block.from_m3} – {block.to_m3 ?? "∞"} m³
                            </td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">
                              {formatCLP(Number(block.price_per_m3))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Sin tramos configurados. Los bloques son de solo lectura en la API;
                    hay que cargarlos desde el backend.
                  </p>
                )}

                {(tariff.blocks?.length ?? 0) > 0 && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Ejemplo: 15 m³ ={" "}
                    <span className="font-semibold">
                      {formatCLP(Number(tariff.fixed_charge) + calcExample(tariff, 15))}
                    </span>{" "}
                    · 25 m³ ={" "}
                    <span className="font-semibold">
                      {formatCLP(Number(tariff.fixed_charge) + calcExample(tariff, 25))}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </PageBody>

      <TariffModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={async (payload) => {
          try {
            await createTariff(payload);
            queryClient.invalidateQueries({ queryKey: ["water", "tariffs"] });
            setOpen(false);
            toast.success("Tarifario creado");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo crear");
          }
        }}
      />
    </PageShell>
  );
}

function calcExample(tariff: WaterTariff, consumption: number): number {
  let total = 0;
  let remaining = consumption;
  const blocks = [...(tariff.blocks ?? [])].sort(
    (a, b) => Number(a.from_m3) - Number(b.from_m3),
  );
  for (const block of blocks) {
    if (remaining <= 0) break;
    const lower = Number(block.from_m3);
    const width =
      block.to_m3 != null ? Math.max(0, Number(block.to_m3) - lower) : Infinity;
    const covered = Math.min(remaining, width);
    total += covered * Number(block.price_per_m3);
    remaining -= covered;
  }
  return total;
}

function TariffModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Parameters<typeof createTariff>[0]) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [fixed, setFixed] = useState("2000");
  const [effective, setEffective] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);

  return (
    <AnimatedOverlay
      open={open}
      onClose={onClose}
      zIndex="z-[70]"
      panelClassName="flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <h2 className="text-base font-semibold">Nuevo tarifario</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Nombre, cargo fijo y vigencia. Los tramos por m³ son de solo lectura en
          la API actual; se muestran si el backend los tiene cargados.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setSaving(true);
            try {
              await onSave({
                name: name.trim(),
                fixed_charge: Number(fixed) || 0,
                effective_from: effective,
              });
            } finally {
              setSaving(false);
            }
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tarifa 2026" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Cargo fijo mensual</label>
              <Input type="number" value={fixed} onChange={(e) => setFixed(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Vigente desde</label>
              <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} required />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              Crear tarifario
            </Button>
          </div>
        </form>
      </div>
    </AnimatedOverlay>
  );
}
