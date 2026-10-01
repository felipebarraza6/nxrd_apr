/**
 * Ruta de inicio post-login según rol APR (Cauce / Smart APR).
 * Solo devuelve rutas que existen en esta app (sin /pos ni /kds de Frig).
 */

export type HomeRouteUser = {
  is_superuser?: boolean;
  type_user?: string;
  branch_assignments?: { branch_id?: string | number; role_code?: string }[];
} | null;

function normalizeDashboardRoute(value: unknown): string | null {
  if (typeof value === "string") return value || null;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["pathname", "path", "route", "href", "url", "slug"]) {
      const v = record[key];
      if (typeof v === "string" && v) return v;
    }
  }
  return null;
}

/**
 * Roles operativos del vertical APR y a dónde deben aterrizar.
 * Roles gastronómicos legacy (WAITER, COCINERO, …) caen a rutas APR seguras.
 */
export function getHomeRouteForUser(
  user: HomeRouteUser,
  dashboard?: string | null,
): string {
  const home = normalizeDashboardRoute(dashboard);
  if (home) return home;
  if (!user) return "/dashboard";
  if (user.is_superuser || user.type_user === "ADM") return "/organization";

  const assignments = user.branch_assignments ?? [];
  const firstRole = assignments[0]?.role_code?.trim().toUpperCase();

  switch (firstRole) {
    case "OWNER":
    case "ADMIN_LOCAL":
    case "MANAGER":
      return "/dashboard";
    case "MEDIDOR":
    case "METER":
      return "/readings/pos";
    case "CAJERO":
    case "EMPLOYEE":
    case "EMPLEADO":
      return "/payments";
    // Legacy Frig — no hay POS/KDS en Cauce
    case "WAITER":
    case "MESERO":
    case "COCINERO":
    case "COOK":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
