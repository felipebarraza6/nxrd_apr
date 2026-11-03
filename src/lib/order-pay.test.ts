import { describe, expect, it } from "vitest";
import { orderPayGate } from "@/lib/order-pay";

describe("orderPayGate", () => {
  it("sin métodos activos: el cobro queda bloqueado y enlaza a /payment-methods", () => {
    const gate = orderPayGate(0, { settled: true });
    expect(gate.confirmDisabled).toBe(true);
    expect(gate.message).toBeTruthy();
    expect(gate.message).toMatch(/método/i);
    expect(gate.methodsHref).toBe("/payment-methods");
    expect(gate.methodsLinkLabel.length).toBeGreaterThan(0);
  });

  it("mientras cargan los métodos no muestra el aviso de vacío", () => {
    const gate = orderPayGate(0, { settled: false });
    expect(gate.confirmDisabled).toBe(true);
    expect(gate.message).toBeNull();
  });

  it("con métodos activos el aviso no bloquea el cobro", () => {
    const gate = orderPayGate(2, { settled: true });
    expect(gate.confirmDisabled).toBe(false);
    expect(gate.message).toBeNull();
    expect(gate.methodsHref).toBe("/payment-methods");
  });
});
