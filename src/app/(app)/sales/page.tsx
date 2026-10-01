"use client";

/**
 * Cargos de agua (órdenes generadas por corridas de cobro).
 * Vertical APR: listado, cobro y anulación — sin POS/mesas/KDS de Frig.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  Ban,
  Eye,
  FileDown,
  Receipt,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PageBody, PageShell } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchOrders,
  cancelOrder,
  generateOrdersExcel,
  type OrdersFilter,
} from "@/lib/api/orders";
import { formatCLP, cn, paymentStatusLabel } from "@/lib/utils";
import {
  useSessionStore,
  useCurrentBranchRole,
  canCancelOrder,
} from "@/lib/store/session";
import { useDownloadFile, exportFilename } from "@/lib/hooks/useDownloadFile";
import { useToast } from "@/lib/store/toast";
import type { YggdraSchemas } from "@/lib/api/types";

const OrderPayModal = dynamic(
  () => import("@/components/sales/order-pay-modal").then((m) => m.OrderPayModal),
  { ssr: false },
);

type Order = YggdraSchemas["Order"] & {
  order_number?: string | null;
  products?: Array<{ id: string; product_name?: string | null; quantity?: number }>;
};

const PAYMENT_OPTIONS = [
  { value: "", label: "Todos los pagos" },
  { value: "PENDING", label: "Pendiente" },
  { value: "PARTIAL", label: "Parcial" },
  { value: "PAID", label: "Pagado" },
];

export default function ChargesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const user = useSessionStore((s) => s.user);
  const role = useCurrentBranchRole();
  const downloadFile = useDownloadFile();
  const { download } = downloadFile;

  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);

  const filter: OrdersFilter = useMemo(
    () => ({
      search: search.trim() || undefined,
      payment_status: paymentStatus || undefined,
      page_size: 100,
      ordering: "-created",
    }),
    [search, paymentStatus],
  );

  const ordersQuery = useQuery({
    queryKey: ["water-charges", filter],
    queryFn: () => fetchOrders(filter),
  });

  const orders = (ordersQuery.data?.results ?? []) as Order[];
  const pending = orders.filter((o) => o.payment_status !== "PAID" && o.status !== "CANCELLED");
  const paidTotal = orders
    .filter((o) => o.payment_status === "PAID")
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const pendingTotal = pending.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water-charges"] });
      setSelected(null);
      toast.success("Cargo anulado");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "No se pudo anular"),
  });

  async function handleExport() {
    try {
      await download(
        async () => ({
          blob: await generateOrdersExcel(orders),
          filename: exportFilename("cargos_agua", "xlsx"),
        }),
        { filename: exportFilename("cargos_agua", "xlsx"), extension: "xlsx" },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Cargos"
        icon={<Receipt className="h-5 w-5" />}
        subtitle="Cargos por consumo de agua generados en las corridas de cobro."
        actions={
          <Button
            variant="outline"
            className="h-9"
            onClick={handleExport}
            disabled={orders.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Excel
          </Button>
        }
      />

      <PageBody className="gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatCard
            variant="compact"
            label="Cargos"
            value={orders.length}
            icon={Receipt}
            tone="primary"
          />
          <StatCard
            variant="compact"
            label="Pendiente"
            value={formatCLP(pendingTotal)}
            icon={Wallet}
            tone="warning"
          />
          <StatCard
            variant="compact"
            label="Cobrado"
            value={formatCLP(paidTotal)}
            icon={Wallet}
            tone="success"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              placeholder="Buscar socio, número…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="h-9 w-44"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        {ordersQuery.isLoading ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sin cargos"
            description="Genera una corrida en Cobros de agua para crear los cargos del período."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Cargo</th>
                  <th className="px-3 py-2 font-medium">Socio</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                  <th className="px-3 py-2 text-center font-medium">Pago</th>
                  <th className="px-3 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((order) => {
                  const canCancel = canCancelOrder(
                    user,
                    role,
                    (order as { processed_by?: string | number }).processed_by,
                  );
                  const unpaid =
                    order.payment_status !== "PAID" && order.status !== "CANCELLED";
                  return (
                    <tr key={order.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5">
                        <p className="font-medium">
                          {order.order_number ?? order.id.slice(0, 8)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {order.date
                            ? new Date(order.date).toLocaleDateString("es-CL")
                            : "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        {order.client && typeof order.client === "object"
                          ? (order.client as { name?: string }).name ?? "—"
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {formatCLP(Number(order.total_amount || 0))}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          className={cn(
                            "text-[10px]",
                            order.payment_status === "PAID" &&
                              "bg-emerald-500/10 text-emerald-700",
                            order.status === "CANCELLED" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {order.status === "CANCELLED"
                            ? "Anulado"
                            : paymentStatusLabel(order.payment_status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="Ver"
                            onClick={() => setSelected(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {unpaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1"
                              onClick={() => setPayOrder(order)}
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              Cobrar
                            </Button>
                          )}
                          {canCancel && unpaid && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive"
                              aria-label="Anular"
                              disabled={cancelMutation.isPending}
                              onClick={() => {
                                if (window.confirm("¿Anular este cargo?")) {
                                  cancelMutation.mutate(String(order.id));
                                }
                              }}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold">
                  Cargo {selected.order_number ?? selected.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {paymentStatusLabel(selected.payment_status)} ·{" "}
                  {formatCLP(Number(selected.total_amount || 0))}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {selected.products && selected.products.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {selected.products.map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 border-b border-border/50 py-1.5"
                  >
                    <span>{p.product_name ?? "Ítem"}</span>
                    <span className="tabular-nums text-muted-foreground">
                      ×{p.quantity ?? 1}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {selected.payment_status !== "PAID" && selected.status !== "CANCELLED" && (
              <Button className="mt-4 w-full" onClick={() => setPayOrder(selected)}>
                <Wallet className="h-4 w-4" />
                Cobrar
              </Button>
            )}
          </div>
        </div>
      )}

      {payOrder && (
        <OrderPayModal
          open
          orderId={String(payOrder.id)}
          orderLabel={String(payOrder.order_number ?? payOrder.id.slice(0, 8))}
          total={Number(payOrder.total_amount || 0)}
          paid={Number(
            (payOrder as { paid_amount?: string | number }).paid_amount || 0,
          )}
          onClose={() => {
            setPayOrder(null);
            queryClient.invalidateQueries({ queryKey: ["water-charges"] });
          }}
        />
      )}
    </PageShell>
  );
}
