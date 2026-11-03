import { describe, expect, it } from "vitest";
import { resolveCanManageCashMovements } from "@/lib/store/session";

const user = { is_superuser: false, type_user: "CL" };

describe("useCanManageCashMovements por rol", () => {
  it.each(["OWNER", "owner", "ADMIN_LOCAL", "admin_local", "CAJERO", "cajero"])(
    "permite %s",
    (role) => {
      expect(resolveCanManageCashMovements({ user, role })).toBe(true);
    },
  );

  it.each(["ADMIN", "CASHIER"])("permite el código equivalente %s", (role) => {
    expect(resolveCanManageCashMovements({ user, role })).toBe(true);
  });

  it.each(["METER", "meter", "MEDIDOR", "EMPLOYEE", "EMPLEADO", "MANAGER", ""])(
    "niega %s",
    (role) => {
      expect(resolveCanManageCashMovements({ user, role })).toBe(false);
    },
  );

  it("sin usuario niega, y un superusuario puede aunque el rol sea METER", () => {
    expect(resolveCanManageCashMovements({ user: null, role: "OWNER" })).toBe(false);
    expect(
      resolveCanManageCashMovements({
        user: { is_superuser: true, type_user: "CL" },
        role: "METER",
      }),
    ).toBe(true);
  });
});
