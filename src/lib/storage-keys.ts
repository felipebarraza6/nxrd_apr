/**
 * Claves de almacenamiento Cauce (antes prefijo `frig.*`).
 * Migración one-shot: si existe la clave legacy y no la nueva, se copia.
 */

export const STORAGE = {
  token: "cauce.token",
  branchId: "cauce.branch_id",
  session: "cauce.session",
  demoExpiresAt: "cauce.demo_expires_at",
  authNotice: "cauce.auth_notice",
} as const;

const LEGACY: Record<keyof typeof STORAGE, string> = {
  token: "frig.token",
  branchId: "frig.branch_id",
  session: "frig.session",
  demoExpiresAt: "frig.demo_expires_at",
  authNotice: "frig.auth_notice",
};

let migrated = false;

/** Copia claves frig.* → cauce.* una sola vez por carga de página. */
export function migrateFrigStorageKeys(): void {
  if (typeof window === "undefined" || migrated) return;
  migrated = true;
  try {
    for (const key of Object.keys(STORAGE) as (keyof typeof STORAGE)[]) {
      const next = STORAGE[key];
      const prev = LEGACY[key];
      if (window.localStorage.getItem(next) == null) {
        const fromLocal = window.localStorage.getItem(prev);
        if (fromLocal != null) {
          window.localStorage.setItem(next, fromLocal);
          window.localStorage.removeItem(prev);
        }
      } else {
        window.localStorage.removeItem(prev);
      }
      if (window.sessionStorage.getItem(next) == null) {
        const fromSession = window.sessionStorage.getItem(prev);
        if (fromSession != null) {
          window.sessionStorage.setItem(next, fromSession);
          window.sessionStorage.removeItem(prev);
        }
      } else {
        window.sessionStorage.removeItem(prev);
      }
    }
  } catch {
    // storage puede fallar en modo privado
  }
}
