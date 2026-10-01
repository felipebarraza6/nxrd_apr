/**
 * Completa la sesión tras login_complete o magic-login: token, config, tema, home.
 */

import { setToken } from "@/lib/api/session-storage";
import { fetchFrontendConfig } from "@/lib/api/frontend-config";
import { fetchBranchTheme, applyThemeConfig } from "@/lib/api/branches";
import { pickDefaultBranchId } from "@/lib/branch-session";
import { getHomeRouteForUser } from "@/lib/home-route";
import { STORAGE } from "@/lib/storage-keys";
import { useSessionStore } from "@/lib/store/session";
import type { LoginCompleteResponse } from "@/lib/types";

export type CompleteLoginNavigate = (path: string) => void;

/**
 * Persiste token + sesión y navega al home del rol.
 * Misma secuencia que el login con clave / magic-link.
 */
export async function completeLoginSession(
  res: LoginCompleteResponse,
  navigate: CompleteLoginNavigate,
): Promise<void> {
  setToken(res.token);
  const store = useSessionStore.getState();
  store.setOwnedOrganizations(res.owned_organizations ?? null);

  if (typeof window !== "undefined") {
    if (res.demo_expires_at) {
      window.localStorage.setItem(STORAGE.demoExpiresAt, res.demo_expires_at);
    } else {
      window.localStorage.removeItem(STORAGE.demoExpiresAt);
    }
  }

  const target = pickDefaultBranchId(res.user, res.branches);
  if (target) {
    try {
      const config = await fetchFrontendConfig(Number(target));
      store.setFrontendConfig(config, target);
      if (!(res.user.is_superuser || res.user.type_user === "ADM")) {
        try {
          const branchTheme = await fetchBranchTheme(target);
          if (branchTheme) {
            store.setTheme(branchTheme);
            applyThemeConfig(branchTheme);
          }
        } catch {
          // tema no crítico
        }
      }
      navigate(getHomeRouteForUser(config.user, config.dashboard));
      return;
    } catch {
      // Falló frontend-config: el layout reactivará la sucursal.
    }
  }

  store.setSession(res.user, res.branches, res.permissions ?? null);
  navigate("/dashboard");
}
