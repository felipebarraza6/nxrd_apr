import type { RoleDefinition } from "@/lib/types";

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN_LOCAL: "Administrador",
  EMPLOYEE: "Empleado",
  EMPLEADO: "Empleado",
  MEDIDOR: "Medidor",
};

export function getRoleLabel(code?: string | null): string | undefined {
  if (!code) return undefined;
  // El backend puede devolver el código en minúsculas (ej: "admin_local").
  const normalized = code.toUpperCase();
  return ROLE_LABELS[normalized] ?? ROLE_LABELS[code] ?? code;
}

/**
 * Roles del producto Cauce (APR): exactamente 3, asignables por el admin.
 * - ADMIN_LOCAL: administración completa del APR.
 * - EMPLOYEE: operación general sin administración.
 * - MEDIDOR: tomador de lecturas casa por casa (POS de lectura).
 * El propietario de la sucursal existe a nivel backend (OWNER) y siempre
 * tiene acceso total; no es asignable desde la app.
 */
const CAUCE_ROLE_CATALOG: { codes: string[]; label: string; module: string | null }[] = [
  { codes: ["ADMIN_LOCAL"], label: "Administrador", module: null },
  { codes: ["EMPLOYEE", "EMPLEADO"], label: "Empleado", module: null },
  { codes: ["MEDIDOR"], label: "Medidor", module: null },
];

export interface FrigRoleOption {
  id: number | string;
  code: string;
  label: string;
}

/**
 * Cruza el catálogo Cauce con las RoleDefinition reales de la sucursal
 * (se necesita su id para invitar/cambiar rol).
 */
export function frigRoleOptions(
  roles: RoleDefinition[],
  _enabledModules: string[],
): FrigRoleOption[] {
  const options: FrigRoleOption[] = [];
  for (const entry of CAUCE_ROLE_CATALOG) {
    const def = roles.find(
      (d) => d.code && entry.codes.includes(d.code.toUpperCase()),
    );
    if (def) options.push({ id: def.id, code: entry.codes[0], label: entry.label });
  }
  return options;
}
