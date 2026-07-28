/**
 * Coerção numérica defensiva — BE lab às vezes manda amount/cost como string
 * (`"1500.00"`), e `sum + string` vira concatenação.
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
    const n = Number(normalized);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/** Soma campo numérico (ou string coercível) de uma lista. */
export function sumBy<T>(items: readonly T[], pick: (item: T) => unknown): number {
  return items.reduce((sum, item) => sum + toNumber(pick(item)), 0);
}
