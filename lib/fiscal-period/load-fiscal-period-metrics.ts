import type { Prisma } from "@prisma/client";

import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

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

export type FiscalPeriodClosingSnapshot = {
  fiscalPeriodId: string;
  label: string;
  startDate: string;
  endDate: string;
  revenueTotal: number;
  expenseTotal: number;
  creditTotal: number;
  netBalance: number;
  paidRevenueTotal: number;
  paidExpenseTotal: number;
  netCashFlow: number;
  revenueCount: number;
  expenseCount: number;
  creditCount: number;
  receivableOutstandingTotal: number;
  receivableCount: number;
};

export async function loadFiscalPeriodClosingSnapshot(
  period: FiscalPeriodRecord
): Promise<FiscalPeriodClosingSnapshot> {
  const from = new Date(period.startDate);
  const to = new Date(period.endDate);

  const periodWhere: Prisma.TransactionWhereInput = {
    createdAt: { gte: from, lte: to },
  };

  const [revenues, expenses, credits, receivables] = await Promise.all([
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
    prisma.transaction.findMany({
      where: {
        ...ACTIVE_REVENUE_WHERE,
        remainingAmount: { gt: 0 },
      },
      select: { remainingAmount: true },
    }),
  ]);

  const revenueTotal = sumAmounts(revenues, "totalAmount");
  const expenseTotal = sumAmounts(expenses, "totalAmount");
  const creditTotal = sumAmounts(credits, "totalAmount");
  const paidRevenueTotal = sumAmounts(revenues, "paidAmount");
  const paidExpenseTotal = sumAmounts(expenses, "paidAmount");

  return {
    fiscalPeriodId: period.id,
    label: period.label,
    startDate: period.startDate,
    endDate: period.endDate,
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
    receivableOutstandingTotal: roundMoney(
      receivables.reduce((sum, row) => sum + decimalToNumber(row.remainingAmount), 0)
    ),
    receivableCount: receivables.length,
  };
}
