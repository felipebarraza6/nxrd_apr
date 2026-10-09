/**
 * Misma regla que `active_tariff_for` del backend: el tarifario vigente es el
 * de `effective_from` más reciente que ya empezó. Uno futuro no aplica.
 */

export function localISODate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function pickVigenteTariff<T extends { effective_from: string }>(
  tariffs: readonly T[],
  today = localISODate(),
): T | null {
  let vigente: T | null = null;
  for (const tariff of tariffs) {
    if (tariff.effective_from > today) continue;
    if (!vigente || tariff.effective_from > vigente.effective_from) {
      vigente = tariff;
    }
  }
  return vigente;
}
