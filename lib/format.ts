/** Formats an integer cent amount as a BRL currency string (e.g. 610000 -> "R$ 6.100,00"). */
export function formatCurrencyBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Parses a BRL-style form input ("6100" or "6100,50") into integer cents.
 * Returns null for empty/invalid input — value is optional throughout.
 */
export function parseCurrencyInputToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}
