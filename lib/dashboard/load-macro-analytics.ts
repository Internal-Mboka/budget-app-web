import {
  addMonths,
  startOfMonth,
} from "date-fns";

import type { MacroKpiPeriod } from "@/lib/dashboard/periods";
import {
  countDaysInclusive,
  formatChartBucketLabel,
  getKpiPeriodRange,
} from "@/lib/dashboard/periods";
import { loadDashboardKpis, loadRevenueExpenseSeries, type RevenueExpensePoint } from "@/lib/dashboard/load-analytics";
import { estimateStudioCapacityHours } from "@/lib/dashboard/studio-capacity";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type MacroDashboardKpis = {
  revenueTotal: number;
  netMargin: number;
  occupancyRate: number;
  periodLabel: string;
};

function extractDurationHours(metadata: unknown): number {
  if (!metadata || typeof metadata !== "object") {
    return 0;
  }

  const value = (metadata as Record<string, unknown>).durationHours;
  const hours = Number(value);

  return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

export async function loadMacroDashboardKpis(
  period: MacroKpiPeriod = "month",
  reference = new Date()
): Promise<MacroDashboardKpis> {
  const { from, to, label } = getKpiPeriodRange(period, reference);
  const base = await loadDashboardKpis(period, reference);

  const studioRows = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      revenueCategory: "STUDIO_SESSION",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      createdAt: { gte: from, lte: to },
    },
    select: { metadata: true },
  });

  const soldHours = roundMoney(studioRows.reduce((sum, row) => sum + extractDurationHours(row.metadata), 0));
  const capacityHours = estimateStudioCapacityHours(countDaysInclusive(from, to));
  const occupancyRate =
    capacityHours > 0 ? roundMoney(Math.min(100, (soldHours / capacityHours) * 100)) : 0;

  return {
    revenueTotal: base.revenueTotal,
    netMargin: roundMoney(base.revenueTotal - base.expenseTotal),
    occupancyRate,
    periodLabel: label,
  };
}

export async function loadMacroRevenueTrend(
  period: MacroKpiPeriod = "month",
  reference = new Date()
): Promise<RevenueExpensePoint[]> {
  const { from, to } = getKpiPeriodRange(period, reference);

  if (period === "month") {
    const series = await loadRevenueExpenseSeries("day", reference);
    return series.map((point) => ({
      ...point,
      expense: 0,
    }));
  }

  const bucketStarts: Date[] = [];
  let cursor = startOfMonth(from);
  const end = startOfMonth(to);

  while (cursor <= end) {
    bucketStarts.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  const bucketMap = new Map<string, RevenueExpensePoint>();

  for (const start of bucketStarts) {
    bucketMap.set(start.toISOString(), {
      key: start.toISOString(),
      label: formatChartBucketLabel(start, "month"),
      revenue: 0,
      expense: 0,
    });
  }

  const rows = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      createdAt: { gte: from, lte: to },
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
  });

  for (const row of rows) {
    const key = startOfMonth(row.createdAt).toISOString();
    const point = bucketMap.get(key);

    if (!point) {
      continue;
    }

    point.revenue = roundMoney(point.revenue + decimalToNumber(row.totalAmount));
  }

  return bucketStarts
    .map((start) => bucketMap.get(start.toISOString()))
    .filter((point): point is RevenueExpensePoint => Boolean(point));
}
