import { usePathname } from "next/navigation";

/**
 * Normaliza un pathname para comparaciones de rutas: sin barra final (salvo
 * "/"), sin query/hash. El hosting estático sirve `/ruta/` (index.html del
 * directorio) y `usePathname()` devuelve la barra final tal cual, lo que
 * rompía comparaciones exactas como `=== "/readings/pos"`.
 */
export function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  const clean = pathname.split(/[?#]/)[0] || "/";
  const trimmed = clean.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** `usePathname()` normalizado (ver `normalizePathname`). */
export function useNormalizedPathname(): string {
  return normalizePathname(usePathname());
}
