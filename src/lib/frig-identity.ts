import type { CSSProperties } from "react";

/**
 * Identidad visual Frig para las páginas de autenticación cuando NO hay
 * branding de tenant (localhost, dominios propios de Frig). Con un theme
 * de sucursal activo NO se aplica: la paleta la deriva applyThemeConfig
 * desde el primary del tenant (lo que el usuario eligió es lo que ve).
 */
export const FRIG_IDENTITY_STYLE = {
  "--brand-primary": "#0369a1",
  "--color-primary": "#0369a1",
  "--primary": "#0369a1",
  "--ring": "#0369a1",
  "--input": "#27272a",
  "--border": "#27272a",
  "--background": "#f8fafc",
  "--card": "#ffffff",
  "--muted": "#f1f5f9",
  "--muted-foreground": "#a1a1aa",
  "--accent": "#f1f5f9",
  "--secondary": "#f1f5f9",
} as CSSProperties;

/** Repo público de Frig — atribución sutil en logins de tenants. */
export const FRIG_REPO_URL = "https://github.com/FelipeBarraza6/frig";

/**
 * Reemplaza TODOS los link[rel=icon] del head por uno nuevo. Necesario
 * porque el layout define varios (icon.png, icon-192, apple-touch...) y
 * cambiar solo el primero no garantiza que el navegador lo use.
 *
 * IMPORTANTE: los link de iconos los renderiza React (metadata del App
 * Router). Hay que actualizar su href EN SITIO, nunca removerlos: si se
 * eliminan por fuera, el commit de la siguiente navegación intenta borrar
 * nodos ya desmontados y React crashea con
 * "Cannot read properties of null (reading 'removeChild')", dejando la
 * página congelada justo después del login.
 */
export function setFaviconHref(href: string): void {
  const links = document.querySelectorAll<HTMLLinkElement>(
    "head link[rel='icon'], head link[rel='apple-touch-icon'], head link[rel='shortcut icon']",
  );
  if (links.length > 0) {
    links.forEach((link) => {
      link.href = href;
    });
    return;
  }
  // Sin links previos (caso extremo), crear uno es seguro: React no lo
  // conoce y nunca intentará removerlo.
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Favicon del tenant con cascada: favicon propio → logo del header →
 * nada (queda el de Frig).
 */
export function setTenantFavicon(
  favicon: string | null | undefined,
  logo: string | null | undefined,
): void {
  const href = favicon || logo;
  if (!href) return;
  setFaviconHref(href);
}
