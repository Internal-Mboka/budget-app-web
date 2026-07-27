import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import type { FinancialExportFilters } from "@/lib/exports/filters";
import { getFinancialExportDateRange } from "@/lib/exports/filters";
import type { ExpenseRecapPdfData } from "@/lib/exports/expense-recap/types";
import { getApprovalStatusLabel } from "@/lib/expenses/approval";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import { getExpenseAttachments } from "@/lib/expenses/attachments";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";

const ACTIVE_EXPENSE_WHERE = {
  type: "EXPENSE" as const,
  isAdjustment: false,
  isRecurring: false,
  approvalStatus: { not: "REJECTED" as const },
};

function formatPeriodLabel(from: string, to: string): string {
  const fromLabel = format(parseISO(`${from}T12:00:00`), "d MMMM yyyy", { locale: fr });
  const toLabel = format(parseISO(`${to}T12:00:00`), "d MMMM yyyy", { locale: fr });
  return `du ${fromLabel} au ${toLabel}`;
}

export function getExpenseRecapPdfFilename(from: string, to: string): string {
  return `recap-depenses-mboka-${from}_${to}.pdf`;
}

export async function loadExpenseRecapPdfData(
  filters: FinancialExportFilters
): Promise<ExpenseRecapPdfData | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.from) || !/^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    return null;
  }

  const { from, to } = getFinancialExportDateRange(filters);

  const rows = await prisma.transaction.findMany({
    where: {
      ...ACTIVE_EXPENSE_WHERE,
      createdAt: { gte: from, lte: to },
    },
    orderBy: [{ createdAt: "asc" }, { code: "asc" }],
    select: {
      code: true,
      createdAt: true,
      expenseCategory: true,
      totalAmount: true,
      paidAmount: true,
      paymentMethod: true,
      approvalStatus: true,
      metadata: true,
    },
  });

  if (rows.length === 0) {
    return null;
  }

  const pdfRows = rows.map((row) => ({
    code: row.code,
    dateLabel: format(row.createdAt, "d MMM yyyy", { locale: fr }),
    categoryLabel: row.expenseCategory ? getExpenseCategoryLabel(row.expenseCategory) : "—",
    totalAmount: decimalToNumber(row.totalAmount),
    paidAmount: decimalToNumber(row.paidAmount),
    paymentMethodLabel: getPaymentMethodLabel(row.paymentMethod),
    approvalLabel: getApprovalStatusLabel(row.approvalStatus),
    attachmentCount: getExpenseAttachments(row.metadata).length,
  }));

  const totalAmount = pdfRows.reduce((sum, row) => sum + row.totalAmount, 0);
  const paidTotal = pdfRows.reduce((sum, row) => sum + row.paidAmount, 0);
  const attachmentCount = pdfRows.reduce((sum, row) => sum + row.attachmentCount, 0);
  const stamp = format(new Date(), "yyyyMMdd-HHmm");

  return {
    from: filters.from,
    to: filters.to,
    periodLabel: formatPeriodLabel(filters.from, filters.to),
    documentCode: `DEP-RECAP-${filters.from.replace(/-/g, "")}-${stamp}`,
    rows: pdfRows,
    expenseCount: pdfRows.length,
    attachmentCount,
    totalAmount,
    paidTotal,
    issuedAt: new Date().toISOString(),
  };
}
