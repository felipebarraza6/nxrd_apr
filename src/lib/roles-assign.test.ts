import { describe, expect, it } from "vitest";
import { frigRoleOptions, roleCodeForApi, userFormRoles } from "@/lib/roles";

describe("rol del formulario de usuario", () => {
  it("ofrece Cajero y Medidor con el código que espera el backend (METER)", () => {
    const roles = userFormRoles({ isSuperAdmin: false });
    const codes = roles.map((r) => r.code);
    expect(codes).toContain("CAJERO");
    expect(codes).toContain("METER");
    expect(codes).not.toContain("MEDIDOR");
    expect(roles.find((r) => r.code === "CAJERO")?.label).toBe("Cajero");
    expect(roles.find((r) => r.code === "METER")?.label).toBe("Medidor");
  });

  it("MEDIDOR y METER se envían como METER", () => {
    expect(roleCodeForApi("MEDIDOR")).toBe("METER");
    expect(roleCodeForApi("medidor")).toBe("METER");
    expect(roleCodeForApi("METER")).toBe("METER");
    expect(roleCodeForApi("CAJERO")).toBe("CAJERO");
    expect(roleCodeForApi("ADMIN_LOCAL")).toBe("ADMIN_LOCAL");
  });

  it("al editar un medidor (código viejo o de catálogo) no duplica la opción", () => {
    for (const current of ["MEDIDOR", "METER"]) {
      const roles = userFormRoles({ isSuperAdmin: false, currentRole: current });
      expect(roles.filter((r) => r.label === "Medidor")).toHaveLength(1);
      expect(roles.find((r) => r.label === "Medidor")?.code).toBe("METER");
    }
  });
});

describe("frigRoleOptions cruza el catálogo con la sucursal", () => {
  it("reconoce CAJERO y METER y devuelve esos códigos", () => {
    const options = frigRoleOptions(
      [
        { id: 1, code: "ADMIN_LOCAL", name: "Administrador" },
        { id: 2, code: "CAJERO", name: "Cajero" },
        { id: 3, code: "METER", name: "Medidor" },
        { id: 4, code: "EMPLOYEE", name: "Empleado" },
      ],
      [],
    );
    expect(options.map((o) => o.code)).toEqual([
      "ADMIN_LOCAL",
      "CAJERO",
      "EMPLOYEE",
      "METER",
    ]);
    expect(options.find((o) => o.code === "METER")?.label).toBe("Medidor");
    expect(options.find((o) => o.code === "CAJERO")?.label).toBe("Cajero");
  });
});
