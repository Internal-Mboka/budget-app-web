import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { parseRecurringDueMetadata } from "@/lib/expenses/recurring";
import type { ExpenseCategory } from "@prisma/client";

export type RecurringExpenseDueItem = {
  id: string;
  code: string;
  expenseCategory: ExpenseCategory;
  totalAmount: number;
  currency: string;
  paymentMethod: string | null;
  metadata: ExpenseMetadata | null;
  dueDate: string;
  periodLabel: string;
  templateCode: string;
  createdAt: string;
};

export async function loadPendingRecurringDues(limit = 20): Promise<RecurringExpenseDueItem[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      isRecurring: false,
      isAdjustment: false,
      status: "RESERVE_ACOMPTE_REQUIS",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      code: true,
      expenseCategory: true,
      totalAmount: true,
      currency: true,
      paymentMethod: true,
      metadata: true,
      createdAt: true,
    },
  });

  return rows
    .map((row) => {
      const due = parseRecurringDueMetadata(row.metadata);

      if (!due || !row.expenseCategory) {
        return null;
      }

      return {
        id: row.id,
        code: row.code,
        expenseCategory: row.expenseCategory as ExpenseCategory,
        totalAmount: decimalToNumber(row.totalAmount),
        currency: row.currency,
        paymentMethod: row.paymentMethod,
        metadata: row.metadata as ExpenseMetadata | null,
        dueDate: due.dueDate,
        periodLabel: due.periodLabel,
        templateCode: due.templateCode,
        createdAt: row.createdAt.toISOString(),
      };
    })
    .filter((row): row is RecurringExpenseDueItem => row !== null)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function countPendingRecurringDues(): Promise<number> {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      isRecurring: false,
      isAdjustment: false,
      status: "RESERVE_ACOMPTE_REQUIS",
    },
    select: { metadata: true },
  });

  return rows.filter((row) => parseRecurringDueMetadata(row.metadata)).length;
}
