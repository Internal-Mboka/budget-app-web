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

import type { DashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import type { DashboardKpiScope } from "@/lib/dashboard/kpi-scope";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { formatChartBucketLabel, getChartRange, getKpiPeriodRange } from "@/lib/dashboard/periods";
import {
  loadCashRevenueMovements,
  loadGlobalCashCollections,
  loadGlobalCashDisbursements,
  loadPeriodCashCollections,
  loadPeriodCashDisbursements,
} from "@/lib/dashboard/load-cash-collections";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type DashboardKpis = {
  revenueTotal: number;
  expenseTotal: number;
  cashCollections: number;
  cashCollectionsHint: string;
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

export async function loadCurrentNetTreasury(): Promise<number> {
  const [paidRevenues, paidExpenses] = await Promise.all([
    prisma.transaction.findMany({
      where: ACTIVE_REVENUE_WHERE,
      select: { paidAmount: true },
    }),
    prisma.transaction.findMany({
      where: ACTIVE_EXPENSE_WHERE,
      select: { paidAmount: true },
    }),
  ]);

  return roundMoney(sumDecimal(paidRevenues, "paidAmount") - sumDecimal(paidExpenses, "paidAmount"));
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

export async function loadGlobalFinancialTotals(accountingMode: DashboardAccountingMode = "accrual") {
  if (accountingMode === "cash") {
    const [revenueTotal, expenseTotal] = await Promise.all([
      loadGlobalCashCollections(),
      loadGlobalCashDisbursements(),
    ]);

    return { revenueTotal, expenseTotal };
  }

  const [allRevenues, allExpenses] = await Promise.all([
    prisma.transaction.findMany({
      where: ACTIVE_REVENUE_WHERE,
      select: { totalAmount: true },
    }),
    prisma.transaction.findMany({
      where: ACTIVE_EXPENSE_WHERE,
      select: { totalAmount: true },
    }),
  ]);

  return {
    revenueTotal: sumDecimal(allRevenues, "totalAmount"),
    expenseTotal: sumDecimal(allExpenses, "totalAmount"),
  };
}

export async function loadDashboardKpis(
  kpiPeriod: DashboardKpiPeriod = "month",
  reference = new Date(),
  kpiScope: DashboardKpiScope = "period",
  accountingMode: DashboardAccountingMode = "accrual"
): Promise<DashboardKpis> {
  const { from, to, label } = getKpiPeriodRange(kpiPeriod, reference);
  const financialTotals =
    kpiScope === "global"
      ? await loadGlobalFinancialTotals(accountingMode)
      : await loadPeriodFinancialTotals(from, to, accountingMode);

  const cashCollectionsPromise =
    kpiScope === "global"
      ? loadGlobalCashCollections()
      : loadPeriodCashCollections(from, to);

  const [netTreasury, receivableRows, cashCollections] = await Promise.all([
    loadCurrentNetTreasury(),
    prisma.transaction.findMany({
      where: {
        ...ACTIVE_REVENUE_WHERE,
        remainingAmount: { gt: 0 },
      },
      select: { remainingAmount: true },
    }),
    cashCollectionsPromise,
  ]);

  const periodLabel = kpiScope === "global" ? "Cumul global" : label;
  const cashCollectionsHint =
    kpiScope === "global"
      ? "Encaissements réels · cumul historique"
      : `Encaissements réels · ${label.toLowerCase()}`;

  return {
    revenueTotal: financialTotals.revenueTotal,
    expenseTotal: financialTotals.expenseTotal,
    cashCollections,
    cashCollectionsHint,
    netTreasury,
    receivables: roundMoney(
      receivableRows.reduce((sum, row) => sum + decimalToNumber(row.remainingAmount), 0)
    ),
    periodLabel,
  };
}

export async function loadPeriodFinancialTotals(
  from: Date,
  to: Date,
  accountingMode: DashboardAccountingMode = "accrual"
) {
  if (accountingMode === "cash") {
    const [revenueTotal, expenseTotal] = await Promise.all([
      loadPeriodCashCollections(from, to),
      loadPeriodCashDisbursements(from, to),
    ]);

    return { revenueTotal, expenseTotal };
  }

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
  reference = new Date(),
  accountingMode: DashboardAccountingMode = "accrual"
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

  if (accountingMode === "cash") {
    const [revenueMovements, expenseRows] = await Promise.all([
      loadCashRevenueMovements(from, to),
      prisma.transaction.findMany({
        where: {
          ...ACTIVE_EXPENSE_WHERE,
          paidAmount: { gt: 0 },
          createdAt: { gte: from, lte: to },
        },
        select: {
          paidAmount: true,
          createdAt: true,
        },
      }),
    ]);

    for (const movement of revenueMovements) {
      const bucketStart = getBucketStart(new Date(movement.movementAt), granularity);
      const point = bucketMap.get(bucketStart.toISOString());

      if (!point) {
        continue;
      }

      point.revenue = roundMoney(point.revenue + decimalToNumber(movement.amount));
    }

    for (const row of expenseRows) {
      const bucketStart = getBucketStart(row.createdAt, granularity);
      const point = bucketMap.get(bucketStart.toISOString());

      if (!point) {
        continue;
      }

      point.expense = roundMoney(point.expense + decimalToNumber(row.paidAmount));
    }

    return bucketStarts
      .map((start) => bucketMap.get(start.toISOString()))
      .filter((point): point is RevenueExpensePoint => Boolean(point));
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
