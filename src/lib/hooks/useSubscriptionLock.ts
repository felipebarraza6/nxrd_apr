"use client";

import {
  useCurrentBranch,
  useCurrentBranchRole,
  useIsSuperAdmin,
  useSessionStore,
} from "@/lib/store/session";
import type { SubscriptionLockReason } from "@/lib/subscription";
import type { Branch } from "@/lib/types";

export interface SubscriptionLockState {
  /** Siempre false en Cauce: el acceso lo define el admin vía roles. */
  locked: boolean;
  isLoading: boolean;
  reason: SubscriptionLockReason | null;
  /** OWNER (o superadmin) administra usuarios y accesos de la sucursal. */
  canManageSubscription: boolean;
  branch: Branch | null;
}

/**
 * Gate de acceso de Cauce/nxrd_apr.
 *
 * El acceso NO se decide por suscripción SaaS (modelo de frig): lo define el
 * admin asignando usuarios, roles y módulos por sucursal. El hook conserva
 * la misma interfaz para no tocar a sus consumidores, pero siempre reporta
 * la app desbloqueada — los roles operativos (cajero, dueño, etc.) siguen
 * filtrando menú y rutas por su cuenta.
 */
export function useSubscriptionLock(): SubscriptionLockState {
  const isSuperAdmin = useIsSuperAdmin();
  const role = useCurrentBranchRole();
  const sessionBranch = useCurrentBranch();

  const canManageSubscription = isSuperAdmin || role === "OWNER";

  return {
    locked: false,
    isLoading: false,
    reason: null,
    canManageSubscription,
    branch: sessionBranch,
  };
}
