import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { friendlyUserSaveError } from "@/lib/user-save-error";

describe("friendlyUserSaveError", () => {
  it("un 500 con nombre de modelo no se muestra crudo", () => {
    const err = new ApiError(
      500,
      "Error al crear usuario: No existe BranchRoleDefinition 'MEDIDOR' en sucursal 107",
    );
    const message = friendlyUserSaveError(err, "crear");
    expect(message).not.toMatch(/BranchRoleDefinition/);
    expect(message).not.toMatch(/sucursal 107/);
    expect(message).not.toMatch(/500/);
    expect(message).not.toMatch(/MEDIDOR/);
    expect(message).toMatch(/rol/i);
  });

  it("un 500 genérico es un mensaje de producto", () => {
    const err = new ApiError(500, "Internal Server Error");
    const message = friendlyUserSaveError(err, "crear");
    expect(message).not.toMatch(/Internal Server Error|500/);
    expect(message.length).toBeGreaterThan(0);
  });

  it("un error de validación ya en español se conserva", () => {
    const err = new ApiError(400, "El correo ya está registrado.");
    expect(friendlyUserSaveError(err, "crear")).toBe("El correo ya está registrado.");
  });
});
