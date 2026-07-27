import type { DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiComparisonLabel, getKpiPeriodRange, getPreviousKpiPeriodRange } from "@/lib/dashboard/periods";
import { loadPeriodFinancialTotals } from "@/lib/dashboard/load-analytics";
import { roundMoney } from "@/lib/transactions/decimal";

export type KpiMetricComparison = {
  current: number;
  previous: number;
  percentChange: number | null;
  comparisonLabel: string;
};

export type DashboardKpiComparison = {
  revenue: KpiMetricComparison;
  expenses: KpiMetricComparison;
};

export function computePercentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return roundMoney(((current - previous) / previous) * 100);
}

export async function loadDashboardKpiComparison(
  kpiPeriod: DashboardKpiPeriod = "month",
  reference = new Date()
): Promise<DashboardKpiComparison> {
  const currentRange = getKpiPeriodRange(kpiPeriod, reference);
  const previousRange = getPreviousKpiPeriodRange(kpiPeriod, reference);
  const comparisonLabel = getKpiComparisonLabel(kpiPeriod);

  const [currentTotals, previousTotals] = await Promise.all([
    loadPeriodFinancialTotals(currentRange.from, currentRange.to),
    loadPeriodFinancialTotals(previousRange.from, previousRange.to),
  ]);

  return {
    revenue: {
      current: currentTotals.revenueTotal,
      previous: previousTotals.revenueTotal,
      percentChange: computePercentChange(currentTotals.revenueTotal, previousTotals.revenueTotal),
      comparisonLabel,
    },
    expenses: {
      current: currentTotals.expenseTotal,
      previous: previousTotals.expenseTotal,
      percentChange: computePercentChange(currentTotals.expenseTotal, previousTotals.expenseTotal),
      comparisonLabel,
    },
  };
}
