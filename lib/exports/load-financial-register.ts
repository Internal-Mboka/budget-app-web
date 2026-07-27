import type { Prisma } from "@prisma/client";
import { format } from "date-fns";
import Papa from "papaparse";

import {
  getFinancialExportDateRange,
  type FinancialExportFilters,
  type FinancialExportRegister,
} from "@/lib/exports/filters";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import { getApprovalStatusLabel } from "@/lib/expenses/approval";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import { getPaymentStatusLabel } from "@/lib/transactions/labels";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

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

function formatExportDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export type RevenueExportRow = {
  Code: string;
  "Date saisie": string;
  Client: string;
  Catégorie: string;
  Statut: string;
  "Montant total": string;
  Encaissé: string;
  "Reste dû": string;
  Devise: string;
  "Mode paiement": string;
};

export type ExpenseExportRow = {
  Code: string;
  "Date saisie": string;
  Catégorie: string;
  "Montant total": string;
  Payé: string;
  Devise: string;
  "Mode paiement": string;
  Approbation: string;
};

export type JournalExportRow = {
  Type: string;
  Code: string;
  "Date saisie": string;
  Libellé: string;
  "Montant total": string;
  Encaissé_ou_payé: string;
  Devise: string;
  "Mode paiement": string;
};

export type RevenuePdfExportItem = {
  id: string;
  code: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
};

function buildPeriodWhere(filters: FinancialExportFilters): Prisma.TransactionWhereInput {
  const { from, to } = getFinancialExportDateRange(filters);

  return {
    createdAt: { gte: from, lte: to },
  };
}

export async function loadRevenuesForExport(filters: FinancialExportFilters): Promise<RevenueExportRow[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      ...ACTIVE_REVENUE_WHERE,
      ...buildPeriodWhere(filters),
    },
    orderBy: [{ createdAt: "asc" }, { code: "asc" }],
    select: {
      code: true,
      createdAt: true,
      revenueCategory: true,
      totalAmount: true,
      paidAmount: true,
      remainingAmount: true,
      currency: true,
      paymentMethod: true,
      status: true,
      client: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    Code: row.code,
    "Date saisie": formatExportDate(row.createdAt),
    Client: row.client?.name ?? "",
    Catégorie: row.revenueCategory ? getRevenueCategoryLabel(row.revenueCategory) : "",
    Statut: getPaymentStatusLabel(row.status),
    "Montant total": decimalToNumber(row.totalAmount).toFixed(2),
    Encaissé: decimalToNumber(row.paidAmount).toFixed(2),
    "Reste dû": decimalToNumber(row.remainingAmount).toFixed(2),
    Devise: row.currency,
    "Mode paiement": getPaymentMethodLabel(row.paymentMethod),
  }));
}

export async function loadExpensesForExport(filters: FinancialExportFilters): Promise<ExpenseExportRow[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      ...ACTIVE_EXPENSE_WHERE,
      ...buildPeriodWhere(filters),
    },
    orderBy: [{ createdAt: "asc" }, { code: "asc" }],
    select: {
      code: true,
      createdAt: true,
      expenseCategory: true,
      totalAmount: true,
      paidAmount: true,
      currency: true,
      paymentMethod: true,
      approvalStatus: true,
    },
  });

  return rows.map((row) => ({
    Code: row.code,
    "Date saisie": formatExportDate(row.createdAt),
    Catégorie: row.expenseCategory ? getExpenseCategoryLabel(row.expenseCategory) : "",
    "Montant total": decimalToNumber(row.totalAmount).toFixed(2),
    Payé: decimalToNumber(row.paidAmount).toFixed(2),
    Devise: row.currency,
    "Mode paiement": getPaymentMethodLabel(row.paymentMethod),
    Approbation: getApprovalStatusLabel(row.approvalStatus),
  }));
}

export async function loadJournalForExport(filters: FinancialExportFilters): Promise<JournalExportRow[]> {
  const [revenues, expenses] = await Promise.all([
    loadRevenuesForExport(filters),
    loadExpensesForExport(filters),
  ]);

  const journalRows: JournalExportRow[] = [
    ...revenues.map((row) => ({
      Type: "Revenu",
      Code: row.Code,
      "Date saisie": row["Date saisie"],
      Libellé: `${row.Catégorie}${row.Client ? ` — ${row.Client}` : ""}`,
      "Montant total": row["Montant total"],
      Encaissé_ou_payé: row.Encaissé,
      Devise: row.Devise,
      "Mode paiement": row["Mode paiement"],
    })),
    ...expenses.map((row) => ({
      Type: "Dépense",
      Code: row.Code,
      "Date saisie": row["Date saisie"],
      Libellé: row.Catégorie,
      "Montant total": row["Montant total"],
      Encaissé_ou_payé: row.Payé,
      Devise: row.Devise,
      "Mode paiement": row["Mode paiement"],
    })),
  ];

  return journalRows.sort((a, b) => a["Date saisie"].localeCompare(b["Date saisie"]));
}

export async function loadRevenuePdfExportItems(
  filters: FinancialExportFilters,
  pagination?: { skip: number; take: number }
): Promise<RevenuePdfExportItem[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      ...ACTIVE_REVENUE_WHERE,
      ...buildPeriodWhere(filters),
    },
    orderBy: [{ createdAt: "desc" }, { code: "desc" }],
    skip: pagination?.skip,
    take: pagination?.take,
    select: {
      id: true,
      code: true,
      totalAmount: true,
      paidAmount: true,
      createdAt: true,
      client: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    clientName: row.client?.name ?? "—",
    totalAmount: decimalToNumber(row.totalAmount),
    paidAmount: decimalToNumber(row.paidAmount),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countFinancialExportRows(
  filters: FinancialExportFilters,
  register: FinancialExportRegister
): Promise<number> {
  const periodWhere = buildPeriodWhere(filters);

  if (register === "revenues") {
    return prisma.transaction.count({
      where: { ...ACTIVE_REVENUE_WHERE, ...periodWhere },
    });
  }

  if (register === "expenses") {
    return prisma.transaction.count({
      where: { ...ACTIVE_EXPENSE_WHERE, ...periodWhere },
    });
  }

  const [revenueCount, expenseCount] = await Promise.all([
    prisma.transaction.count({ where: { ...ACTIVE_REVENUE_WHERE, ...periodWhere } }),
    prisma.transaction.count({ where: { ...ACTIVE_EXPENSE_WHERE, ...periodWhere } }),
  ]);

  return revenueCount + expenseCount;
}

type CsvRow = RevenueExportRow | ExpenseExportRow | JournalExportRow;

export async function buildFinancialExportCsv(
  filters: FinancialExportFilters,
  register: FinancialExportRegister
): Promise<string> {
  let rows: CsvRow[] = [];

  if (register === "revenues") {
    rows = await loadRevenuesForExport(filters);
  } else if (register === "expenses") {
    rows = await loadExpensesForExport(filters);
  } else {
    rows = await loadJournalForExport(filters);
  }

  const csv = Papa.unparse(rows, { delimiter: ";" });
  return `\uFEFF${csv}`;
}

export function getFinancialExportFilename(
  register: FinancialExportRegister,
  filters: FinancialExportFilters
): string {
  const stamp = `${filters.from}_${filters.to}`;
  const prefix =
    register === "revenues" ? "revenus" : register === "expenses" ? "depenses" : "journal-comptable";

  return `${prefix}-mboka-${stamp}.csv`;
}
