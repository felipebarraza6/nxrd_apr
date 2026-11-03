export interface OrderPayGate {
  /** Sin métodos cargados, o ninguno activo: no se puede confirmar. */
  confirmDisabled: boolean;
  /** Aviso visible. Null mientras la lista aún no llega. */
  message: string | null;
  methodsHref: "/payment-methods";
  methodsLinkLabel: string;
}

/**
 * Decide si el modal de cobro puede confirmar.
 * `settled` es false mientras se cargan los métodos: el botón espera, sin
 * decir que la sucursal no tiene métodos.
 */
export function orderPayGate(
  activeMethodCount: number,
  state: { settled: boolean },
): OrderPayGate {
  const methodsHref = "/payment-methods" as const;
  const methodsLinkLabel = "Crear método de pago";
  if (!state.settled) {
    return { confirmDisabled: true, message: null, methodsHref, methodsLinkLabel };
  }
  if (activeMethodCount <= 0) {
    return {
      confirmDisabled: true,
      message: "No hay métodos de pago activos. Crea uno para poder cobrar.",
      methodsHref,
      methodsLinkLabel,
    };
  }
  return { confirmDisabled: false, message: null, methodsHref, methodsLinkLabel };
}
