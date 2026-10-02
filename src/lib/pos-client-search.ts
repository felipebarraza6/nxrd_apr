/**
 * Búsqueda versátil de socios/medidores para POS (MEDIDOR + CAJERO).
 * Matching accent/case-insensitive; highlight del campo que coincidió.
 */

export type PosSearchField =
  | "name"
  | "address"
  | "meter"
  | "rut"
  | "sector"
  | "order";

export type PosSearchable = {
  name?: string | null;
  address?: string | null;
  meterNumber?: string | null;
  rut?: string | null;
  sector?: string | null;
  orderNumber?: string | null;
};

export type PosSearchMatch = {
  field: PosSearchField;
  label: string;
  value: string;
};

const FIELD_LABEL: Record<PosSearchField, string> = {
  name: "Nombre",
  address: "Dirección",
  meter: "Medidor",
  rut: "RUT",
  sector: "Sector",
  order: "Cargo",
};

/** Quita tildes, lower-case, colapsa espacios. */
export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** RUT/DNI sin puntos ni guión (para matching). */
export function normalizeRutDigits(input: string): string {
  return input.replace(/[.\-\s]/g, "").toLowerCase();
}

function includesFolded(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack || !needle) return false;
  return normalizeSearchText(haystack).includes(needle);
}

/**
 * Devuelve el primer campo que coincide con la query, o null.
 * Orden: medidor → RUT → nombre → dirección → sector → cargo.
 */
export function matchPosSearch(
  item: PosSearchable,
  rawQuery: string,
): PosSearchMatch | null {
  const q = normalizeSearchText(rawQuery);
  if (!q) return null;

  const qRut = normalizeRutDigits(rawQuery);
  const checks: Array<{ field: PosSearchField; value: string | null | undefined }> = [
    { field: "meter", value: item.meterNumber },
    { field: "rut", value: item.rut },
    { field: "name", value: item.name },
    { field: "address", value: item.address },
    { field: "sector", value: item.sector },
    { field: "order", value: item.orderNumber },
  ];

  for (const { field, value } of checks) {
    if (!value) continue;
    if (field === "rut") {
      const digits = normalizeRutDigits(value);
      if (qRut.length >= 2 && digits.includes(qRut)) {
        return { field, label: FIELD_LABEL[field], value };
      }
      if (includesFolded(value, q)) {
        return { field, label: FIELD_LABEL[field], value };
      }
      continue;
    }
    if (includesFolded(value, q)) {
      return { field, label: FIELD_LABEL[field], value };
    }
  }
  return null;
}

export function filterByPosSearch<T>(
  items: T[],
  rawQuery: string,
  toSearchable: (item: T) => PosSearchable,
): Array<{ item: T; match: PosSearchMatch }> {
  const q = normalizeSearchText(rawQuery);
  if (!q) return items.map((item) => ({ item, match: { field: "name", label: "", value: "" } }));

  const out: Array<{ item: T; match: PosSearchMatch }> = [];
  for (const item of items) {
    const match = matchPosSearch(toSearchable(item), rawQuery);
    if (match) out.push({ item, match });
  }
  return out;
}

/** Placeholder unificado del buscador POS. */
export const POS_CLIENT_SEARCH_PLACEHOLDER =
  "buscar por nombre, dirección o medidor";

/**
 * Orden de resultados del POS con búsqueda activa: pendientes primero, luego
 * los ya leídos en el período (siguen visibles), con el fijado (pinned) arriba.
 */
export function orderPosSearchResults<T extends { id: string }>(
  matches: readonly T[],
  isRead: (item: T) => boolean,
  pinnedId?: string | null,
): T[] {
  const pending = matches.filter((m) => !isRead(m));
  const read = matches.filter((m) => isRead(m));
  const list = [...pending, ...read];
  const pinned = pinnedId ? list.find((m) => m.id === pinnedId) : undefined;
  return pinned ? [pinned, ...list.filter((m) => m.id !== pinnedId)] : list;
}
