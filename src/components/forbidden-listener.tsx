"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/lib/store/toast";
import { FRIG_ALWAYS_ON_MODULES } from "@/lib/modules";
import { useIsCashier } from "@/lib/store/session";
import {
  formatDemoBlockedMessage,
  looksLikeDemoBlockedError,
} from "@/lib/cauce-demo";
import { STORAGE } from "@/lib/storage-keys";

/**
 * Escucha el evento global "api:forbidden" disparado por apiFetch cuando una
 * petición recibe 403. Muestra un toast discreto y evita redirigir a roles
 * operativos (cajero/medidor/empleado) o quedarse en un loop si /dashboard
 * también falla.
 *
 * Los módulos core (siempre activos) no generan toast ni redirección: si el
 * backend los reporta deshabilitados es un problema de configuración, no una
 * acción del usuario.
 */
export function ForbiddenListener() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const isOperationalRole = useIsCashier();

  // Regex compilada una sola vez con word-boundaries: evita que "sales"
  // matchee "salesperson" o "config" matchee "configuration".
  const alwaysOnRegex = useMemo(
    () =>
      new RegExp(
        `\\b(${FRIG_ALWAYS_ON_MODULES.join("|")})\\b`,
        "i",
      ),
    [],
  );

  useEffect(() => {
    function handleForbidden(e: Event) {
      const error = e instanceof CustomEvent ? (e.detail as ApiError) : null;
      const rawMessage = error?.message && error.message !== "Error 403" ? error.message : "";
      const inDemo =
        typeof window !== "undefined" &&
        Boolean(window.localStorage.getItem(STORAGE.demoExpiresAt));
      const message =
        inDemo && looksLikeDemoBlockedError(error ?? rawMessage)
          ? formatDemoBlockedMessage(rawMessage)
          : rawMessage || "No tienes permiso para ver esta función.";

      // Si el error proviene de un módulo core (siempre activo), no
      // molestamos al usuario: el backend debería tenerlo habilitado.
      if (rawMessage && alwaysOnRegex.test(rawMessage) && !inDemo) {
        return;
      }

      // Errores de "módulo no habilitado para esta sucursal": la UI ya oculta
      // esas secciones y el 403 suele venir de peticiones secundarias/paralelas.
      const isModuleDisabled = /no está habilitado/i.test(rawMessage);
      if (!isModuleDisabled) {
        toast.error(message);
      }

      // No redirigir roles operativos ni si ya estamos en /dashboard.
      // En demo tampoco redirigir: el 403 suele ser acción bloqueada (DTE/Flow).
      if (isOperationalRole || pathname === "/dashboard" || inDemo) {
        return;
      }

      router.replace("/dashboard");
    }

    window.addEventListener("api:forbidden", handleForbidden);
    return () => window.removeEventListener("api:forbidden", handleForbidden);
  }, [router, pathname, toast, isOperationalRole, alwaysOnRegex]);

  return null;
}
