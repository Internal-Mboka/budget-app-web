import type { FinancialExportFilters } from "@/lib/exports/filters";
import { buildPeriodKey } from "@/lib/period-closure/dates";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type FinancialPeriodClosureRecord = {
  id: string;
  periodKey: string;
  fiscalPeriodId: string | null;
  startDate: string;
  endDate: string;
  documentCode: string;
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
  receivableOutstandingTotal: number | null;
  receivableCount: number | null;
  integrityHash: string;
  closedAt: string;
  closedByUserId: string;
  closedByName: string;
};

function mapClosureRow(row: {
  id: string;
  periodKey: string;
  fiscalPeriodId: string | null;
  startDate: Date;
  endDate: Date;
  documentCode: string;
  revenueTotal: { toString(): string };
  expenseTotal: { toString(): string };
  creditTotal: { toString(): string };
  netBalance: { toString(): string };
  paidRevenueTotal: { toString(): string };
  paidExpenseTotal: { toString(): string };
  netCashFlow: { toString(): string };
  revenueCount: number;
  expenseCount: number;
  creditCount: number;
  receivableOutstandingTotal: { toString(): string } | null;
  receivableCount: number | null;
  integrityHash: string;
  closedAt: Date;
  closedByUserId: string;
  closedBy: { firstName: string; lastName: string; email: string };
}): FinancialPeriodClosureRecord {
  const closedByName =
    `${row.closedBy.firstName} ${row.closedBy.lastName}`.trim() || row.closedBy.email;

  return {
    id: row.id,
    periodKey: row.periodKey,
    fiscalPeriodId: row.fiscalPeriodId,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    documentCode: row.documentCode,
    revenueTotal: roundMoney(decimalToNumber(row.revenueTotal)),
    expenseTotal: roundMoney(decimalToNumber(row.expenseTotal)),
    creditTotal: roundMoney(decimalToNumber(row.creditTotal)),
    netBalance: roundMoney(decimalToNumber(row.netBalance)),
    paidRevenueTotal: roundMoney(decimalToNumber(row.paidRevenueTotal)),
    paidExpenseTotal: roundMoney(decimalToNumber(row.paidExpenseTotal)),
    netCashFlow: roundMoney(decimalToNumber(row.netCashFlow)),
    revenueCount: row.revenueCount,
    expenseCount: row.expenseCount,
    creditCount: row.creditCount,
    receivableOutstandingTotal:
      row.receivableOutstandingTotal === null
        ? null
        : roundMoney(decimalToNumber(row.receivableOutstandingTotal)),
    receivableCount: row.receivableCount,
    integrityHash: row.integrityHash,
    closedAt: row.closedAt.toISOString(),
    closedByUserId: row.closedByUserId,
    closedByName,
  };
}

const closureSelect = {
  id: true,
  periodKey: true,
  fiscalPeriodId: true,
  startDate: true,
  endDate: true,
  documentCode: true,
  revenueTotal: true,
  expenseTotal: true,
  creditTotal: true,
  netBalance: true,
  paidRevenueTotal: true,
  paidExpenseTotal: true,
  netCashFlow: true,
  revenueCount: true,
  expenseCount: true,
  creditCount: true,
  receivableOutstandingTotal: true,
  receivableCount: true,
  integrityHash: true,
  closedAt: true,
  closedByUserId: true,
  closedBy: { select: { firstName: true, lastName: true, email: true } },
} as const;

export async function loadFinancialPeriodClosureByKey(
  periodKey: string
): Promise<FinancialPeriodClosureRecord | null> {
  const row = await prisma.financialPeriodClosure.findUnique({
    where: { periodKey },
    select: closureSelect,
  });

  return row ? mapClosureRow(row) : null;
}

export async function loadFinancialPeriodClosureForFilters(
  filters: FinancialExportFilters
): Promise<FinancialPeriodClosureRecord | null> {
  return loadFinancialPeriodClosureByKey(buildPeriodKey(filters.from));
}

export async function loadFinancialPeriodClosureById(
  id: string
): Promise<FinancialPeriodClosureRecord | null> {
  const row = await prisma.financialPeriodClosure.findUnique({
    where: { id },
    select: closureSelect,
  });

  return row ? mapClosureRow(row) : null;
}

export async function loadFinancialPeriodClosureByFiscalPeriodId(
  fiscalPeriodId: string
): Promise<FinancialPeriodClosureRecord | null> {
  const row = await prisma.financialPeriodClosure.findUnique({
    where: { fiscalPeriodId },
    select: closureSelect,
  });

  return row ? mapClosureRow(row) : null;
}

export async function isDateInClosedFinancialPeriod(date: Date): Promise<boolean> {
  const closure = await prisma.financialPeriodClosure.findFirst({
    where: {
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: { id: true },
  });

  return closure !== null;
}
