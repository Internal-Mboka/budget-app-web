import { Prisma } from "@prisma/client";
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from "date-fns";

import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { formatChartBucketLabel, getChartRange, getKpiPeriodRange } from "@/lib/dashboard/periods";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type DashboardKpis = {
  revenueTotal: number;
  expenseTotal: number;
  netTreasury: number;
  receivables: number;
  periodLabel: string;
};

export type RevenueExpensePoint = {
  key: string;
  label: string;
  revenue: number;
  expense: number;
};

const ACTIVE_EXPENSE_WHERE: Prisma.TransactionWhereInput = {
  type: "EXPENSE",
  isAdjustment: false,
  approvalStatus: { not: "REJECTED" },
};

const ACTIVE_REVENUE_WHERE: Prisma.TransactionWhereInput = {
  type: "REVENUE",
  isAdjustment: false,
  status: { not: "LITIGE_ANNULE" },
};

function sumDecimal(
  values: Array<{ totalAmount: Prisma.Decimal | null; paidAmount?: Prisma.Decimal | null }>,
  field: "totalAmount" | "paidAmount"
) {
  return roundMoney(
    values.reduce((sum, row) => sum + decimalToNumber(field === "paidAmount" ? row.paidAmount : row.totalAmount), 0)
  );
}

function buildBucketStarts(granularity: DashboardChartGranularity, from: Date, bucketCount: number) {
  const starts: Date[] = [];

  for (let index = 0; index < bucketCount; index += 1) {
    if (granularity === "day") {
      starts.push(startOfDay(addDays(from, index)));
      continue;
    }

    if (granularity === "week") {
      starts.push(startOfWeek(addWeeks(from, index), { weekStartsOn: 1 }));
      continue;
    }

    if (granularity === "quarter") {
      starts.push(startOfQuarter(addQuarters(from, index)));
      continue;
    }

    starts.push(startOfMonth(addMonths(from, index)));
  }

  return starts;
}

function getBucketStart(date: Date, granularity: DashboardChartGranularity) {
  if (granularity === "day") {
    return startOfDay(date);
  }

  if (granularity === "week") {
    return startOfWeek(date, { weekStartsOn: 1 });
  }

  if (granularity === "quarter") {
    return startOfQuarter(date);
  }

  return startOfMonth(date);
}

export async function loadDashboardKpis(
  kpiPeriod: DashboardKpiPeriod = "month",
  reference = new Date()
): Promise<DashboardKpis> {
  const { from, to, label } = getKpiPeriodRange(kpiPeriod, reference);
  const periodTotals = await loadPeriodFinancialTotals(from, to);

  const [paidRevenues, paidExpenses, receivableRows] = await Promise.all([
    prisma.transaction.findMany({
      where: ACTIVE_REVENUE_WHERE,
      select: { paidAmount: true },
    }),
    prisma.transaction.findMany({
      where: ACTIVE_EXPENSE_WHERE,
      select: { paidAmount: true },
    }),
    prisma.transaction.findMany({
      where: {
        ...ACTIVE_REVENUE_WHERE,
        remainingAmount: { gt: 0 },
      },
      select: { remainingAmount: true },
    }),
  ]);

  return {
    revenueTotal: periodTotals.revenueTotal,
    expenseTotal: periodTotals.expenseTotal,
    netTreasury: roundMoney(sumDecimal(paidRevenues, "paidAmount") - sumDecimal(paidExpenses, "paidAmount")),
    receivables: roundMoney(
      receivableRows.reduce((sum, row) => sum + decimalToNumber(row.remainingAmount), 0)
    ),
    periodLabel: label,
  };
}

export async function loadPeriodFinancialTotals(from: Date, to: Date) {
  const [periodRevenues, periodExpenses] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        ...ACTIVE_REVENUE_WHERE,
        createdAt: { gte: from, lte: to },
      },
      select: { totalAmount: true },
    }),
    prisma.transaction.findMany({
      where: {
        ...ACTIVE_EXPENSE_WHERE,
        createdAt: { gte: from, lte: to },
      },
      select: { totalAmount: true },
    }),
  ]);

  return {
    revenueTotal: sumDecimal(periodRevenues, "totalAmount"),
    expenseTotal: sumDecimal(periodExpenses, "totalAmount"),
  };
}

export async function loadRevenueExpenseSeries(
  granularity: DashboardChartGranularity,
  reference = new Date()
): Promise<RevenueExpensePoint[]> {
  const { from, to, bucketCount } = getChartRange(granularity, reference);
  const bucketStarts = buildBucketStarts(granularity, from, bucketCount);
  const bucketMap = new Map<string, RevenueExpensePoint>();

  for (const start of bucketStarts) {
    const key = start.toISOString();
    bucketMap.set(key, {
      key,
      label: formatChartBucketLabel(start, granularity),
      revenue: 0,
      expense: 0,
    });
  }

  const rows = await prisma.transaction.findMany({
    where: {
      isAdjustment: false,
      createdAt: { gte: from, lte: to },
      OR: [ACTIVE_REVENUE_WHERE, ACTIVE_EXPENSE_WHERE],
    },
    select: {
      type: true,
      totalAmount: true,
      createdAt: true,
      status: true,
      approvalStatus: true,
    },
  });

  for (const row of rows) {
    if (row.type === "REVENUE" && row.status === "LITIGE_ANNULE") {
      continue;
    }

    if (row.type === "EXPENSE" && row.approvalStatus === "REJECTED") {
      continue;
    }

    const bucketStart = getBucketStart(row.createdAt, granularity);
    const key = bucketStart.toISOString();
    const point = bucketMap.get(key);

    if (!point) {
      continue;
    }

    const amount = decimalToNumber(row.totalAmount);

    if (row.type === "REVENUE") {
      point.revenue = roundMoney(point.revenue + amount);
    } else {
      point.expense = roundMoney(point.expense + amount);
    }
  }

  return bucketStarts
    .map((start) => bucketMap.get(start.toISOString()))
    .filter((point): point is RevenueExpensePoint => Boolean(point));
}
