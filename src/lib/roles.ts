import type { RoleDefinition } from "@/lib/types";

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  ADMIN_LOCAL: "Administrador",
  MANAGER: "Gerente",
  CAJERO: "Cajero",
  CASHIER: "Cajero",
  EMPLOYEE: "Empleado",
  EMPLEADO: "Empleado",
  METER: "Medidor",
  MEDIDOR: "Medidor",
};

export function getRoleLabel(code?: string | null): string | undefined {
  if (!code) return undefined;
  // El backend puede devolver el código en minúsculas (ej: "admin_local").
  const normalized = code.toUpperCase();
  return ROLE_LABELS[normalized] ?? ROLE_LABELS[code] ?? code;
}

/**
 * Roles del producto Cauce (APR) asignables por el admin.
 * El backend guarda el medidor como METER (no MEDIDOR) y el cajero como CAJERO.
 * - ADMIN_LOCAL: administración completa del APR.
 * - CAJERO: caja y cobros.
 * - EMPLOYEE: operación general sin administración.
 * - METER: tomador de lecturas casa por casa (POS de lectura).
 * El propietario de la sucursal existe a nivel backend (OWNER) y siempre
 * tiene acceso total; no es asignable desde la app.
 */
const CAUCE_ROLE_CATALOG: { codes: string[]; label: string; module: string | null }[] = [
  { codes: ["ADMIN_LOCAL"], label: "Administrador", module: null },
  { codes: ["CAJERO", "CASHIER"], label: "Cajero", module: null },
  { codes: ["EMPLOYEE", "EMPLEADO"], label: "Empleado", module: null },
  { codes: ["METER", "MEDIDOR"], label: "Medidor", module: null },
];

/** Códigos que el formulario puede mostrar. El valor enviado es el del backend. */
const USER_FORM_ROLES: { code: string; label: string }[] = [
  { code: "OWNER", label: "Propietario" },
  { code: "ADMIN_LOCAL", label: "Administrador" },
  { code: "MANAGER", label: "Gerente" },
  { code: "CAJERO", label: "Cajero" },
  { code: "EMPLOYEE", label: "Empleado" },
  { code: "METER", label: "Medidor" },
];

/** MEDIDOR es la etiqueta vieja; el alta y el cambio de rol esperan METER. */
const API_ROLE_ALIASES: Record<string, string> = {
  MEDIDOR: "METER",
  METER: "METER",
};

export function roleCodeForApi(code: string): string {
  const normalized = code.trim().toUpperCase();
  return API_ROLE_ALIASES[normalized] ?? normalized;
}

export function userFormRoles(opts: {
  isSuperAdmin: boolean;
  currentRole?: string | null;
}): { code: string; label: string }[] {
  const roles = USER_FORM_ROLES.filter(
    (role) => opts.isSuperAdmin || role.code !== "OWNER",
  );
  const current = opts.currentRole?.trim();
  if (!current) return roles;
  const apiCode = roleCodeForApi(current);
  if (roles.some((role) => role.code === apiCode)) return roles;
  return [...roles, { code: apiCode, label: getRoleLabel(apiCode) ?? apiCode }];
}

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
