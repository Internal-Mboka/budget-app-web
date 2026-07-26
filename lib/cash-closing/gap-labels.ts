import { formatMoney } from "@/lib/currency";

/** Libellé plain-language pour une différence espèces ou mobile money. */
export function formatGapDifference(gap: number): string {
  if (gap === 0) {
    return "Conforme";
  }

  if (gap > 0) {
    return `${formatMoney(gap)} de trop`;
  }

  return `Il manque ${formatMoney(Math.abs(gap))}`;
}
