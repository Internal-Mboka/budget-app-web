import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import {
  getRecurringPeriodLabel,
  parseRecurringScheduleMetadata,
  type RecurringPeriod,
} from "@/lib/expenses/recurring";
import type { ExpenseCategory } from "@prisma/client";

export type RecurringExpenseTemplateItem = {
  id: string;
  code: string;
  expenseCategory: ExpenseCategory;
  totalAmount: number;
  currency: string;
  paymentMethod: string | null;
  recurringPeriod: RecurringPeriod;
  metadata: ExpenseMetadata | null;
  nextDueDate: string | null;
  createdAt: string;
};

export async function loadRecurringExpenseTemplates(): Promise<RecurringExpenseTemplateItem[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      isRecurring: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      expenseCategory: true,
      totalAmount: true,
      currency: true,
      paymentMethod: true,
      recurringPeriod: true,
      metadata: true,
      createdAt: true,
    },
  });

  return rows
    .filter((row) => row.expenseCategory && row.recurringPeriod)
    .map((row) => {
      const schedule = parseRecurringScheduleMetadata(row.metadata);

      return {
        id: row.id,
        code: row.code,
        expenseCategory: row.expenseCategory as ExpenseCategory,
        totalAmount: decimalToNumber(row.totalAmount),
        currency: row.currency,
        paymentMethod: row.paymentMethod,
        recurringPeriod: row.recurringPeriod as RecurringPeriod,
        metadata: row.metadata as ExpenseMetadata | null,
        nextDueDate: schedule?.nextDueDate ?? null,
        createdAt: row.createdAt.toISOString(),
      };
    });
}

export async function countRecurringExpenseTemplates(): Promise<number> {
  return prisma.transaction.count({
    where: { type: "EXPENSE", isRecurring: true },
  });
}

export function formatRecurringTemplateSummary(template: RecurringExpenseTemplateItem): string {
  const label = template.metadata?.label ?? template.code;
  const period = getRecurringPeriodLabel(template.recurringPeriod);

  return `${label} · ${period}`;
}
