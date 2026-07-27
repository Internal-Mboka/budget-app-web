import type { RevenueCategory } from "@prisma/client";

import type { DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiComparisonLabel, getKpiPeriodRange, getPreviousKpiPeriodRange } from "@/lib/dashboard/periods";
import { computePercentChange } from "@/lib/dashboard/percent-change";
import { prisma } from "@/lib/prisma";
import { REVENUE_CATEGORY_OPTIONS } from "@/lib/revenues/categories";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type RevenueCategoryBreakdownPoint = {
  category: RevenueCategory;
  label: string;
  amount: number;
  share: number;
  percentChange: number | null;
};

export type RevenueByCategoryResult = {
  points: RevenueCategoryBreakdownPoint[];
  periodLabel: string;
  total: number;
  totalPercentChange: number | null;
  comparisonLabel: string;
};

const ACTIVE_REVENUE_WHERE = {
  type: "REVENUE" as const,
  isAdjustment: false,
  status: { not: "LITIGE_ANNULE" as const },
};

export async function loadRevenueByCategory(
  period: DashboardKpiPeriod = "month",
  reference = new Date()
): Promise<RevenueByCategoryResult> {
  const currentRange = getKpiPeriodRange(period, reference);
  const previousRange = getPreviousKpiPeriodRange(period, reference);
  const comparisonLabel = getKpiComparisonLabel(period);

  const [currentPoints, previousPoints] = await Promise.all([
    loadRevenueByCategoryForRange(currentRange.from, currentRange.to),
    loadRevenueByCategoryForRange(previousRange.from, previousRange.to),
  ]);

  const previousByCategory = new Map(previousPoints.map((point) => [point.category, point.amount]));
  const total = roundMoney(currentPoints.reduce((sum, point) => sum + point.amount, 0));
  const previousTotal = roundMoney(previousPoints.reduce((sum, point) => sum + point.amount, 0));

  const points = currentPoints.map((point) => ({
    ...point,
    share: total > 0 ? roundMoney((point.amount / total) * 100) : 0,
    percentChange: computePercentChange(point.amount, previousByCategory.get(point.category) ?? 0),
  }));

  points.sort((left, right) => right.amount - left.amount);

  return {
    points,
    periodLabel: currentRange.label,
    total,
    totalPercentChange: computePercentChange(total, previousTotal),
    comparisonLabel,
  };
}

async function loadRevenueByCategoryForRange(from: Date, to: Date) {
  const rows = await prisma.transaction.groupBy({
    by: ["revenueCategory"],
    where: {
      ...ACTIVE_REVENUE_WHERE,
      createdAt: { gte: from, lte: to },
      revenueCategory: { not: null },
    },
    _sum: { totalAmount: true },
  });

  const amountByCategory = new Map<RevenueCategory, number>();

  for (const row of rows) {
    if (!row.revenueCategory) {
      continue;
    }

    amountByCategory.set(row.revenueCategory, roundMoney(decimalToNumber(row._sum.totalAmount)));
  }

  return REVENUE_CATEGORY_OPTIONS.map(({ value, label: categoryLabel }) => ({
    category: value,
    label: categoryLabel,
    amount: amountByCategory.get(value) ?? 0,
    share: 0,
    percentChange: null as number | null,
  }));
}
