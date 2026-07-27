"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { resolveExpenseApprovalOnCreate, requiresExpenseApproval } from "@/lib/expenses/approval";
import { syncRecurringExpenseDues } from "@/lib/expenses/generate-recurring-dues";
import { parseRecurringDueMetadata } from "@/lib/expenses/recurring";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateTransactionCode } from "@/lib/transactions/code";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";
import { parseCreateRecurringExpenseTemplateFormData } from "@/lib/validations/recurring-expense";

export type RecurringExpenseActionResult =
  | { success: true; transactionId?: string; code?: string }
  | { success: false; error: string };

export type RecurringExpenseFormState = RecurringExpenseActionResult | null;

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

export async function createRecurringExpenseTemplateFormAction(
  _prevState: RecurringExpenseFormState,
  formData: FormData
): Promise<RecurringExpenseFormState> {
  const result = await createRecurringExpenseTemplateAction(formData);

  if (result.success && result.transactionId) {
    redirect(`/expenses/recurring?created=1`);
  }

  return result;
}

export async function createRecurringExpenseTemplateAction(
  formData: FormData
): Promise<RecurringExpenseActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE)) {
    return { success: false, error: "Permission insuffisante pour configurer une dépense récurrente." };
  }

  let parsed;

  try {
    parsed = parseCreateRecurringExpenseTemplateFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const totalAmount = roundMoney(parsed.totalAmount);

  try {
    const auditMeta = await captureAuditRequestContext();

    const created = await prisma.$transaction(async (tx) => {
      const code = await generateTransactionCode();

      const transaction = await tx.transaction.create({
        data: {
          code,
          type: "EXPENSE",
          expenseCategory: parsed.expenseCategory,
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(0),
          remainingAmount: new Prisma.Decimal(totalAmount),
          currency: parsed.currency,
          status: "DEVIS_PROFORMA",
          paymentMethod: parsed.paymentMethod,
          approvalStatus: "NOT_REQUIRED",
          isRecurring: true,
          recurringPeriod: parsed.recurringPeriod,
          metadata: {
            label: parsed.label,
            notes: parsed.notes,
            recurringSchedule: {
              nextDueDate: parsed.nextDueDate,
            },
          },
          createdById: session.user.id,
        },
        select: {
          id: true,
          code: true,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "RECURRING_EXPENSE_TEMPLATE_CREATED",
        entity: "Transaction",
        entityId: transaction.id,
        userId: session.user.id,
        details: {
          code: transaction.code,
          expenseCategory: parsed.expenseCategory,
          expenseCategoryLabel: getExpenseCategoryLabel(parsed.expenseCategory),
          recurringPeriod: parsed.recurringPeriod,
          totalAmount,
          nextDueDate: parsed.nextDueDate,
          label: parsed.label,
          performedBy: session.user.email,
        },
      });

      return transaction;
    });

    await syncRecurringExpenseDues();

    revalidatePath("/expenses/recurring");
    revalidatePath("/expenses");
    revalidatePath("/dashboard/financier");

    return { success: true, transactionId: created.id, code: created.code };
  } catch (error) {
    console.error("createRecurringExpenseTemplateAction failed", error);
    return { success: false, error: "Impossible d'enregistrer la dépense récurrente." };
  }
}

export async function confirmRecurringDueFormAction(
  _prevState: RecurringExpenseFormState,
  formData: FormData
): Promise<RecurringExpenseFormState> {
  const transactionId = String(formData.get("transactionId") ?? "");
  const result = await confirmRecurringDueAction(transactionId);

  if (result.success) {
    redirect(`/expenses/${transactionId}?disbursed=1`);
  }

  return result;
}

export async function confirmRecurringDueAction(transactionId: string): Promise<RecurringExpenseActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE)) {
    return { success: false, error: "Permission insuffisante pour confirmer le décaissement." };
  }

  try {
    const expense = await prisma.transaction.findFirst({
      where: { id: transactionId, type: "EXPENSE", isRecurring: false },
      select: {
        id: true,
        code: true,
        status: true,
        totalAmount: true,
        metadata: true,
        expenseCategory: true,
      },
    });

    if (!expense) {
      return { success: false, error: "Échéance introuvable." };
    }

    const recurringDue = parseRecurringDueMetadata(expense.metadata);

    if (!recurringDue) {
      return { success: false, error: "Cette écriture n'est pas une échéance récurrente." };
    }

    if (expense.status === "SOLDE") {
      return { success: false, error: "Cette échéance est déjà réglée." };
    }

    const totalAmount = roundMoney(decimalToNumber(expense.totalAmount));
    const creatorCanApprove = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);
    const approval = resolveExpenseApprovalOnCreate(totalAmount, creatorCanApprove, session.user.id);

    const auditMeta = await captureAuditRequestContext();

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: expense.id },
        data: {
          status: "SOLDE",
          paidAmount: expense.totalAmount,
          remainingAmount: new Prisma.Decimal(0),
          approvalStatus: approval.approvalStatus,
          approvedById: approval.approvedById,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "RECURRING_EXPENSE_DISBURSED",
        entity: "Transaction",
        entityId: expense.id,
        userId: session.user.id,
        details: {
          code: expense.code,
          templateCode: recurringDue.templateCode,
          dueDate: recurringDue.dueDate,
          periodLabel: recurringDue.periodLabel,
          totalAmount,
          approvalStatus: approval.approvalStatus,
          requiresApproval: requiresExpenseApproval(totalAmount),
          performedBy: session.user.email,
        },
      });

      if (approval.approvalStatus === "PENDING") {
        await writeAuditLog({
          tx,
          requestMeta: auditMeta,
          captureRequest: false,
          action: "EXPENSE_APPROVAL_REQUESTED",
          entity: "Transaction",
          entityId: expense.id,
          userId: session.user.id,
          details: {
            code: expense.code,
            totalAmount,
            source: "recurring_due",
            performedBy: session.user.email,
          },
        });
      }
    });

    revalidatePath("/expenses");
    revalidatePath("/expenses/recurring");
    revalidatePath(`/expenses/${transactionId}`);
    revalidatePath("/dashboard/financier");

    return { success: true, transactionId };
  } catch (error) {
    console.error("confirmRecurringDueAction failed", error);
    return { success: false, error: "Impossible de confirmer le décaissement." };
  }
}

export async function ensureRecurringExpenseDuesSynced(): Promise<number> {
  await getSession();
  return syncRecurringExpenseDues();
}
