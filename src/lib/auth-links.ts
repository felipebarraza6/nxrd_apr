/** Placeholder de `generateStaticParams` en el export estático. No es un token. */
const STATIC_TOKEN_PLACEHOLDER = "__";

function decodeSegment(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Token de `/reset-password/<token>`, `/accept-invitation/<token>` o
 * `/login/<slug>/reset-password/<token>`.
 * Decodifica `%2B` como `+`. El placeholder `__` del export estático es vacío.
 */
export function readResetOrInvitationToken(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] ?? "";
  const match = path.match(/\/(?:reset-password|accept-invitation)\/([^/]+)\/?$/);
  if (!match) return "";
  const raw = match[1];
  if (!raw || raw === STATIC_TOKEN_PLACEHOLDER) return "";
  return decodeSegment(raw);
}

/**
 * Lee un query param sin la regla de `URLSearchParams` que convierte `+` en espacio.
 * `%2B` y un `+` literal quedan como `+`.
 */
export function readQueryToken(search: string, key: string): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  if (!query) return null;
  for (const part of query.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const rawKey = eq < 0 ? part : part.slice(0, eq);
    const rawValue = eq < 0 ? "" : part.slice(eq + 1);
    if (decodeSegment(rawKey) !== key) continue;
    return decodeSegment(rawValue);
  }
  return null;
}

/**
 * El correo de nuevo acceso apunta a `/login/<slug>/login`.
 * Esa ruta no es el login: se abre `/login?branch=<slug>` y, si viene token, se re-codifica.
 */
export function loginHrefFromInvitationPath(pathname: string, search: string): string {
  const path = pathname.split(/[?#]/)[0] ?? "";
  const match = path.match(/\/login\/([^/]+)\/login\/?$/);
  if (!match) return "/login";
  const slug = decodeSegment(match[1]);
  const token = readQueryToken(search, "token");
  const branch = encodeURIComponent(slug);
  if (!token) return `/login?branch=${branch}`;
  return `/login?branch=${branch}&token=${encodeURIComponent(token)}`;
}
