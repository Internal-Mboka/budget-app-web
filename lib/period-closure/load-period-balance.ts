import type { Prisma } from "@prisma/client";

import type { FinancialExportFilters } from "@/lib/exports/filters";
import {
  buildPeriodDocumentCode,
  buildPeriodKey,
  buildPeriodLabel,
  getPeriodDateRange,
  isFullCivilMonthPeriod,
} from "@/lib/period-closure/dates";
import { computePeriodBalanceIntegrityHash, type PeriodBalanceSnapshot } from "@/lib/period-closure/integrity";
import type { PeriodBalancePdfData } from "@/lib/period-closure/pdf/types";

const ACTIVE_REVENUE_WHERE: Prisma.TransactionWhereInput = {
  type: "REVENUE",
  isAdjustment: false,
  status: { not: "LITIGE_ANNULE" },
};

const ACTIVE_EXPENSE_WHERE: Prisma.TransactionWhereInput = {
  type: "EXPENSE",
  isAdjustment: false,
  isRecurring: false,
  approvalStatus: { not: "REJECTED" },
};

const CREDIT_WHERE: Prisma.TransactionWhereInput = {
  isAdjustment: true,
};

function sumAmounts(
  rows: Array<{ totalAmount: Prisma.Decimal | null; paidAmount?: Prisma.Decimal | null }>,
  field: "totalAmount" | "paidAmount"
): number {
  return roundMoney(
    rows.reduce((sum, row) => sum + decimalToNumber(field === "paidAmount" ? row.paidAmount : row.totalAmount), 0)
  );
}

export type PeriodBalanceMetrics = PeriodBalanceSnapshot & {
  periodLabel: string;
};

export async function loadPeriodBalanceMetrics(filters: FinancialExportFilters): Promise<PeriodBalanceMetrics | null> {
  if (!isFullCivilMonthPeriod(filters)) {
    return null;
  }

  const { from, to } = getPeriodDateRange(filters);
  const periodWhere: Prisma.TransactionWhereInput = {
    createdAt: { gte: from, lte: to },
  };

  const [revenues, expenses, credits] = await Promise.all([
    prisma.transaction.findMany({
      where: { ...ACTIVE_REVENUE_WHERE, ...periodWhere },
      select: { totalAmount: true, paidAmount: true },
    }),
    prisma.transaction.findMany({
      where: { ...ACTIVE_EXPENSE_WHERE, ...periodWhere },
      select: { totalAmount: true, paidAmount: true },
    }),
    prisma.transaction.findMany({
      where: { ...CREDIT_WHERE, ...periodWhere },
      select: { totalAmount: true },
    }),
  ]);

  const revenueTotal = sumAmounts(revenues, "totalAmount");
  const expenseTotal = sumAmounts(expenses, "totalAmount");
  const creditTotal = sumAmounts(credits, "totalAmount");
  const paidRevenueTotal = sumAmounts(revenues, "paidAmount");
  const paidExpenseTotal = sumAmounts(expenses, "paidAmount");
  const periodKey = buildPeriodKey(filters.from);

  const snapshot: PeriodBalanceMetrics = {
    periodKey,
    from: filters.from,
    to: filters.to,
    periodLabel: buildPeriodLabel(filters.from, filters.to),
    documentCode: buildPeriodDocumentCode(periodKey),
    revenueTotal,
    expenseTotal,
    creditTotal,
    netBalance: roundMoney(revenueTotal - expenseTotal - creditTotal),
    paidRevenueTotal,
    paidExpenseTotal,
    netCashFlow: roundMoney(paidRevenueTotal - paidExpenseTotal),
    revenueCount: revenues.length,
    expenseCount: expenses.length,
    creditCount: credits.length,
  };

  return snapshot;
}

export function buildPeriodBalanceSnapshotWithHash(metrics: PeriodBalanceMetrics): PeriodBalanceSnapshot & {
  integrityHash: string;
} {
  const { periodLabel: _periodLabel, ...snapshot } = metrics;
  const integrityHash = computePeriodBalanceIntegrityHash(snapshot);

  return {
    ...snapshot,
    integrityHash,
  };
}

export function mapClosureSnapshotToPdfData(input: {
  snapshot: PeriodBalanceSnapshot;
  integrityHash: string;
  integrityHashDisplay: string;
  periodLabel: string;
  issuedAt: string;
  closedAt?: string;
  closedByName?: string;
  isPreview: boolean;
}): PeriodBalancePdfData {
  return {
    ...input.snapshot,
    periodLabel: input.periodLabel,
    integrityHash: input.integrityHash,
    integrityHashDisplay: input.integrityHashDisplay,
    issuedAt: input.issuedAt,
    closedAt: input.closedAt,
    closedByName: input.closedByName,
    isPreview: input.isPreview,
  };
}

export function getPeriodBalancePdfFilename(documentCode: string, preview: boolean): string {
  return preview ? `${documentCode.toLowerCase()}-brouillon.pdf` : `${documentCode.toLowerCase()}.pdf`;
}
