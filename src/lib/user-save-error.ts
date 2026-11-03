import { ApiError } from "@/lib/api/client";

/**
 * Mensaje de producto al crear o editar un usuario.
 * Un 500 (sobre todo el de BranchRoleDefinition) no se muestra crudo.
 * Un 4xx que ya viene en español se conserva.
 */
export function friendlyUserSaveError(err: unknown, action: string): string {
  const verb = action === "actualizar" ? "actualizar" : "crear";
  const generic = `No se pudo ${verb} el usuario. Inténtalo de nuevo.`;

  if (!(err instanceof ApiError)) {
    return err instanceof Error && err.message ? err.message : generic;
  }

  if (err.status >= 500) {
    if (/role|rol/i.test(err.message)) {
      return `No se pudo ${verb} el usuario porque el rol no está disponible en esta sucursal.`;
    }
    return generic;
  }

  const message = err.message?.trim();
  return message || generic;
}
