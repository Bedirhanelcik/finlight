import type { CurrencyCode } from "./types";

export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; label: string; locale: string }
> = {
  TRY: { symbol: "₺", label: "Turkish Lira (TRY)", locale: "tr-TR" },
  USD: { symbol: "$", label: "US Dollar (USD)", locale: "en-US" },
  EUR: { symbol: "€", label: "Euro (EUR)", locale: "de-DE" },
  GBP: { symbol: "£", label: "British Pound (GBP)", locale: "en-GB" },
};

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "TRY",
  options: { signDisplay?: "auto" | "always" | "never"; compact?: boolean } = {},
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const meta = CURRENCY_META[currency];
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency,
      signDisplay: options.signDisplay ?? "auto",
      notation: options.compact ? "compact" : "standard",
      maximumFractionDigits: options.compact ? 1 : 2,
      minimumFractionDigits: options.compact ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return `${meta.symbol}${safeAmount.toFixed(2)}`;
  }
}

export function formatPercent(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatNumberCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
