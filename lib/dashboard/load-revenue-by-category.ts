import type { RevenueCategory } from "@prisma/client";

import type { DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiPeriodRange } from "@/lib/dashboard/periods";
import { prisma } from "@/lib/prisma";
import { REVENUE_CATEGORY_OPTIONS } from "@/lib/revenues/categories";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type RevenueCategoryBreakdownPoint = {
  category: RevenueCategory;
  label: string;
  amount: number;
  share: number;
};

const ACTIVE_REVENUE_WHERE = {
  type: "REVENUE" as const,
  isAdjustment: false,
  status: { not: "LITIGE_ANNULE" as const },
};

export async function loadRevenueByCategory(
  period: DashboardKpiPeriod = "month",
  reference = new Date()
): Promise<{ points: RevenueCategoryBreakdownPoint[]; periodLabel: string; total: number }> {
  const { from, to, label } = getKpiPeriodRange(period, reference);

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

  const points = REVENUE_CATEGORY_OPTIONS.map(({ value, label: categoryLabel }) => ({
    category: value,
    label: categoryLabel,
    amount: amountByCategory.get(value) ?? 0,
    share: 0,
  }));

  const total = roundMoney(points.reduce((sum, point) => sum + point.amount, 0));

  for (const point of points) {
    point.share = total > 0 ? roundMoney((point.amount / total) * 100) : 0;
  }

  points.sort((left, right) => right.amount - left.amount);

  return { points, periodLabel: label, total };
}
