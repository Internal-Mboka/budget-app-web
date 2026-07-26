import currency from "currency.js";

const DEFAULT_OPTIONS = {
  symbol: "$",
  separator: " ",
  decimal: ",",
  precision: 2,
} as const;

export function formatMoney(
  value: number | string,
  options?: Partial<typeof DEFAULT_OPTIONS>
): string {
  return currency(value, { ...DEFAULT_OPTIONS, ...options }).format();
}
