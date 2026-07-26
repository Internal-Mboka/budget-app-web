import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import {
  advanceDueDate,
  formatDuePeriodLabel,
  isDueDateReached,
  parseRecurringDueMetadata,
  parseRecurringScheduleMetadata,
  type RecurringPeriod,
} from "@/lib/expenses/recurring";
import type { ExpenseCategory, PaymentMethod } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { generateTransactionCode } from "@/lib/transactions/code";

type RecurringTemplateRow = {
  id: string;
  code: string;
  expenseCategory: ExpenseCategory | null;
  totalAmount: Prisma.Decimal;
  currency: string;
  paymentMethod: PaymentMethod | null;
  recurringPeriod: string | null;
  metadata: unknown;
  createdById: string;
};

async function dueInstanceExists(templateId: string, dueDate: string): Promise<boolean> {
  const candidates = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      isRecurring: false,
      status: "RESERVE_ACOMPTE_REQUIS",
      metadata: {
        path: ["recurringDue", "templateId"],
        equals: templateId,
      },
    },
    select: { metadata: true },
  });

  return candidates.some((row) => parseRecurringDueMetadata(row.metadata)?.dueDate === dueDate);
}

async function createDueInstance(template: RecurringTemplateRow, dueDate: string, userId: string) {
  const metadata = template.metadata as ExpenseMetadata | null;
  const periodLabel = formatDuePeriodLabel(dueDate);
  const label = metadata?.label ?? template.code;

  const code = await generateTransactionCode();

  return prisma.transaction.create({
    data: {
      code,
      type: "EXPENSE",
      expenseCategory: template.expenseCategory,
      totalAmount: template.totalAmount,
      paidAmount: new Prisma.Decimal(0),
      remainingAmount: template.totalAmount,
      currency: template.currency as "USD" | "CDF",
      status: "RESERVE_ACOMPTE_REQUIS",
      paymentMethod: template.paymentMethod,
      approvalStatus: "NOT_REQUIRED",
      metadata: {
        label: `${label} — ${periodLabel}`,
        notes: metadata?.notes,
        recurringDue: {
          templateId: template.id,
          templateCode: template.code,
          dueDate,
          periodLabel,
        },
      },
      createdById: userId,
    },
  });
}

export async function syncRecurringExpenseDues(referenceDate = new Date()): Promise<number> {
  const templates = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      isRecurring: true,
    },
    select: {
      id: true,
      code: true,
      expenseCategory: true,
      totalAmount: true,
      currency: true,
      paymentMethod: true,
      recurringPeriod: true,
      metadata: true,
      createdById: true,
    },
  });

  let createdCount = 0;

  for (const template of templates) {
    const schedule = parseRecurringScheduleMetadata(template.metadata);
    const period = (template.recurringPeriod ?? "MONTHLY") as RecurringPeriod;

    if (!schedule || !template.expenseCategory) {
      continue;
    }

    let nextDueDate = schedule.nextDueDate;
    let metadataUpdated = false;
    const updatedMetadata = { ...(template.metadata as Record<string, unknown>) };

    while (isDueDateReached(nextDueDate, referenceDate)) {
      const exists = await dueInstanceExists(template.id, nextDueDate);

      if (!exists) {
        await createDueInstance(template, nextDueDate, template.createdById);
        createdCount += 1;
      }

      nextDueDate = advanceDueDate(nextDueDate, period);
      updatedMetadata.recurringSchedule = { nextDueDate };
      metadataUpdated = true;
    }

    if (metadataUpdated) {
      await prisma.transaction.update({
        where: { id: template.id },
        data: { metadata: updatedMetadata as Prisma.InputJsonValue },
      });
    }
  }

  return createdCount;
}
