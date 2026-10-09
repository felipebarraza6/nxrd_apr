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
  updateTariff,
  type TariffWritePayload,
  type WaterTariff,
  type WaterTariffBlock,
} from "@/lib/api/water";
import { pickVigenteTariff } from "@/lib/water-tariff";

export default function TariffsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WaterTariff | null>(null);

  const tariffsQuery = useQuery({
    queryKey: ["water", "tariffs"],
    queryFn: fetchTariffs,
  });

  const tariffs = [...(tariffsQuery.data ?? [])].sort((a, b) =>
    b.effective_from.localeCompare(a.effective_from),
  );
  const vigente = pickVigenteTariff(tariffs);
  const vigenteIdx = vigente ? tariffs.findIndex((t) => t.id === vigente.id) : -1;

  return (
    <PageShell>
      <PageHeader
        title="Tarifarios"
        icon={<ScrollText className="h-5 w-5" />}
        subtitle="Cargo fijo mensual + tramos por m³. Aplica el de vigencia más reciente que ya empezó."
        actions={
          <Button className="h-9" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            Nuevo tarifario
          </Button>
        }
      />

      <PageBody className="gap-4">
        {tariffsQuery.isLoading ? (
          <Skeleton className="h-40" />
        ) : tariffs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Sin tarifarios"
            description="Crea el tarifario del APR: nombre, cargo fijo, vigencia y tramos por m³."
            action={
              <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
                Crear tarifario
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {tariffs.map((tariff, idx) => (
              <div
                key={tariff.id}
                className={`cauce-sheet p-4 sm:px-8 ${
                  idx === vigenteIdx ? "bg-azul/[0.06]" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{tariff.name}</h3>
                      {idx === vigenteIdx && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Vigente
                        </span>
                      )}
                      {idx === 0 && idx !== vigenteIdx && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                          Vigencia futura
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Vigente desde{" "}
                      {new Date(tariff.effective_from).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums">
                      Fijo: {formatCLP(Number(tariff.fixed_charge))}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setEditing(tariff);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>

                {(tariff.blocks?.length ?? 0) > 0 ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Tramo</th>
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
                    Sin tramos. Edita el tarifario y carga los bloques por m³: si no, la corrida cobra solo el cargo fijo.
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
        key={editing?.id ?? "new"}
        open={open}
        initial={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={async (payload) => {
          try {
            if (editing) {
              await updateTariff(editing.id, payload);
              toast.success("Tarifario actualizado");
            } else {
              await createTariff(payload);
              toast.success("Tarifario creado");
            }
            queryClient.invalidateQueries({ queryKey: ["water", "tariffs"] });
            setOpen(false);
            setEditing(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo guardar");
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

type BlockDraft = { from: string; to: string; price: string };

function draftsFrom(tariff: WaterTariff | null): BlockDraft[] {
  if (!tariff || (tariff.blocks ?? []).length === 0) {
    return [
      { from: "0", to: "10", price: "" },
      { from: "10", to: "", price: "" },
    ];
  }
  return [...tariff.blocks]
    .sort((a, b) => Number(a.from_m3) - Number(b.from_m3))
    .map((block) => ({
      from: String(block.from_m3),
      to: block.to_m3 == null ? "" : String(block.to_m3),
      price: String(block.price_per_m3),
    }));
}

function TariffModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: WaterTariff | null;
  onClose: () => void;
  onSave: (payload: TariffWritePayload) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [fixed, setFixed] = useState(initial ? String(initial.fixed_charge) : "2000");
  const [effective, setEffective] = useState(() => {
    if (initial?.effective_from) return initial.effective_from.slice(0, 10);
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [blocks, setBlocks] = useState<BlockDraft[]>(() => draftsFrom(initial));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateBlock(index: number, patch: Partial<BlockDraft>) {
    setBlocks((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <AnimatedOverlay
      open={open}
      onClose={onClose}
      zIndex="z-[70]"
      panelClassName="flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <h2 className="text-base font-semibold">{initial ? "Editar tarifario" : "Nuevo tarifario"}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Cargo fijo más tramos continuos desde 0 m³. El último puede quedar sin tope.
          Deja los precios vacíos si este tarifario es solo cargo fijo.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const priced = blocks.filter((row) => row.price.trim() !== "");
            const half = blocks.some(
              (row) => row.price.trim() === "" && (row.from.trim() !== "" || row.to.trim() !== "") && priced.length > 0,
            );
            if (half && priced.length !== blocks.length) {
              setFormError("Completa el precio de cada tramo, o borra el que no uses.");
              return;
            }
            setFormError(null);
            setSaving(true);
            try {
              await onSave({
                name: name.trim(),
                fixed_charge: Number(fixed) || 0,
                effective_from: effective,
                blocks: priced.map((row) => ({
                  from_m3: row.from,
                  to_m3: row.to.trim() === "" ? null : row.to,
                  price_per_m3: row.price,
                })),
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

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Tramos por m³</p>
            {blocks.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <Input
                  type="number"
                  value={row.from}
                  onChange={(e) => updateBlock(index, { from: e.target.value })}
                  placeholder="Desde"
                  aria-label={`Tramo ${index + 1} desde m³`}
                />
                <Input
                  type="number"
                  value={row.to}
                  onChange={(e) => updateBlock(index, { to: e.target.value })}
                  placeholder="Hasta"
                  aria-label={`Tramo ${index + 1} hasta m³`}
                />
                <Input
                  type="number"
                  value={row.price}
                  onChange={(e) => updateBlock(index, { price: e.target.value })}
                  placeholder="$ / m³"
                  aria-label={`Tramo ${index + 1} precio`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBlocks((rows) => rows.filter((_, i) => i !== index))}
                >
                  Quitar
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                const last = blocks[blocks.length - 1];
                setBlocks((rows) => [...rows, { from: last?.to ?? "0", to: "", price: "" }]);
              }}
            >
              Agregar tramo
            </Button>
          </div>

          {formError ? <p className="text-xs text-destructive">{formError}</p> : null}

          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              {initial ? "Guardar" : "Crear tarifario"}
            </Button>
          </div>
        </form>
      </div>
    </AnimatedOverlay>
  );
}
