import { roundMoney } from "@/lib/transactions/decimal";

export function computePercentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return roundMoney(((current - previous) / previous) * 100);
}

export function formatPercentChangeLabel(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  if (value === 0) {
    return "0 %";
  }

  return `${value > 0 ? "+" : ""}${value.toLocaleString("fr-FR")} %`;
}
