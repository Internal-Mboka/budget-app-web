import type { RevenueExpensePoint } from "@/lib/dashboard/load-analytics";
import { computePercentChange } from "@/lib/dashboard/percent-change";

export type RevenueExpenseComparisonPoint = RevenueExpensePoint & {
  revenueChangePercent: number | null;
  expenseChangePercent: number | null;
};

export function enrichRevenueExpenseSeriesWithComparison(
  series: RevenueExpensePoint[]
): RevenueExpenseComparisonPoint[] {
  return series.map((point, index) => {
    if (index === 0) {
      return {
        ...point,
        revenueChangePercent: null,
        expenseChangePercent: null,
      };
    }

    const previous = series[index - 1];

    return {
      ...point,
      revenueChangePercent: computePercentChange(point.revenue, previous.revenue),
      expenseChangePercent: computePercentChange(point.expense, previous.expense),
    };
  });
}
