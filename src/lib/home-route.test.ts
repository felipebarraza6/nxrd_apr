import { describe, expect, it } from "vitest";
import { getHomeRouteForUser } from "@/lib/home-route";

describe("getHomeRouteForUser", () => {
  it("usa dashboard del backend si viene", () => {
    expect(
      getHomeRouteForUser({ type_user: "CL" }, "/readings"),
    ).toBe("/readings");
  });

  it("superadmin → organización", () => {
    expect(getHomeRouteForUser({ is_superuser: true })).toBe("/organization");
    expect(getHomeRouteForUser({ type_user: "ADM" })).toBe("/organization");
  });

  it("OWNER / ADMIN_LOCAL → dashboard", () => {
    expect(
      getHomeRouteForUser({
        branch_assignments: [{ role_code: "OWNER" }],
      }),
    ).toBe("/dashboard");
    expect(
      getHomeRouteForUser({
        branch_assignments: [{ role_code: "ADMIN_LOCAL" }],
      }),
    ).toBe("/dashboard");
  });

  it("MEDIDOR → POS de lectura", () => {
    expect(
      getHomeRouteForUser({
        branch_assignments: [{ role_code: "MEDIDOR" }],
      }),
    ).toBe("/readings/pos");
  });

  it("CAJERO / EMPLOYEE → pagos", () => {
    expect(
      getHomeRouteForUser({
        branch_assignments: [{ role_code: "CAJERO" }],
      }),
    ).toBe("/payments");
    expect(
      getHomeRouteForUser({
        branch_assignments: [{ role_code: "EMPLOYEE" }],
      }),
    ).toBe("/payments");
  });

  it("roles legacy Frig no apuntan a /pos ni /kds", () => {
    for (const role of ["WAITER", "MESERO", "COCINERO", "COOK"]) {
      const route = getHomeRouteForUser({
        branch_assignments: [{ role_code: role }],
      });
      expect(route).not.toMatch(/^\/pos/);
      expect(route).not.toMatch(/^\/kds/);
      expect(route).toBe("/dashboard");
    }
  });
});
