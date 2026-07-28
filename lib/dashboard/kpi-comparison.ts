import type { DashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import type { DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiComparisonLabel, getKpiPeriodRange, getPreviousKpiPeriodRange } from "@/lib/dashboard/periods";
import { loadPeriodFinancialTotals } from "@/lib/dashboard/load-analytics";
import { computePercentChange } from "@/lib/dashboard/percent-change";

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

export async function loadDashboardKpiComparison(
  kpiPeriod: DashboardKpiPeriod = "month",
  reference = new Date(),
  accountingMode: DashboardAccountingMode = "accrual"
): Promise<DashboardKpiComparison> {
  const currentRange = getKpiPeriodRange(kpiPeriod, reference);
  const previousRange = getPreviousKpiPeriodRange(kpiPeriod, reference);
  const comparisonLabel = getKpiComparisonLabel(kpiPeriod);

  const [currentTotals, previousTotals] = await Promise.all([
    loadPeriodFinancialTotals(currentRange.from, currentRange.to, accountingMode),
    loadPeriodFinancialTotals(previousRange.from, previousRange.to, accountingMode),
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
