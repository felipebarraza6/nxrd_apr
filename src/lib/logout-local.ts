import type { QueryClient } from "@tanstack/react-query";
import { clearToken } from "@/lib/api/session-storage";
import { useSessionStore } from "@/lib/store/session";
import { clearQueryPersist } from "@/lib/query-persist";
import { STORAGE } from "@/lib/storage-keys";

/**
 * Limpieza local al cerrar sesión: token, store, React Query e IndexedDB persistido.
 */
export async function logoutLocal(queryClient: QueryClient): Promise<void> {
  const { user, currentBranchId, clearSession } = useSessionStore.getState();
  const userId = user?.id;
  const branchId = currentBranchId;
  clearToken();
  clearSession();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE.demoExpiresAt);
    window.localStorage.removeItem("frig.demo_expires_at");
  }
  queryClient.clear();
  try {
    await clearQueryPersist(userId, branchId);
  } catch {
    /* idb opcional */
  }
}
