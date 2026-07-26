import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import type { ExpenseCategory } from "@prisma/client";

export type PendingExpenseApprovalItem = {
  id: string;
  code: string;
  expenseCategory: ExpenseCategory;
  totalAmount: number;
  currency: string;
  metadata: ExpenseMetadata | null;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
};

export async function loadPendingExpenseApprovals(limit = 20): Promise<PendingExpenseApprovalItem[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      isAdjustment: false,
      approvalStatus: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      code: true,
      expenseCategory: true,
      totalAmount: true,
      currency: true,
      metadata: true,
      createdAt: true,
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return rows
    .filter((row) => row.expenseCategory)
    .map((row) => ({
      id: row.id,
      code: row.code,
      expenseCategory: row.expenseCategory as ExpenseCategory,
      totalAmount: decimalToNumber(row.totalAmount),
      currency: row.currency,
      metadata: row.metadata as ExpenseMetadata | null,
      createdAt: row.createdAt.toISOString(),
      createdBy: row.createdBy,
    }));
}

export async function countPendingExpenseApprovals(): Promise<number> {
  return prisma.transaction.count({
    where: {
      type: "EXPENSE",
      isAdjustment: false,
      approvalStatus: "PENDING",
    },
  });
}
