"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import {
  isCashAdvanceCategory,
  mergeCashAdvanceWorkflowStatus,
} from "@/lib/expenses/cash-advance";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { Prisma } from "@prisma/client";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

export type ExpenseApprovalActionResult =
  | { success: true }
  | { success: false; error: string };

export type ExpenseApprovalFormState = ExpenseApprovalActionResult | null;

async function assertCanApproveExpense(): Promise<
  { ok: true; userId: string; email: string } | { ok: false; error: string }
> {
  const session = await getSession();

  if (!session?.user) {
    return { ok: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE)) {
    return { ok: false, error: "Permission insuffisante pour approuver une dépense." };
  }

  return { ok: true, userId: session.user.id, email: session.user.email ?? "" };
}

export async function approveExpenseFormAction(
  _prevState: ExpenseApprovalFormState,
  formData: FormData
): Promise<ExpenseApprovalFormState> {
  const transactionId = String(formData.get("transactionId") ?? "");

  if (!transactionId) {
    return { success: false, error: "Dépense introuvable." };
  }

  const result = await approveExpenseAction(transactionId);

  if (result.success) {
    redirect(`/expenses/${transactionId}?approved=1`);
  }

  return result;
}

export async function rejectExpenseFormAction(
  _prevState: ExpenseApprovalFormState,
  formData: FormData
): Promise<ExpenseApprovalFormState> {
  const transactionId = String(formData.get("transactionId") ?? "");

  if (!transactionId) {
    return { success: false, error: "Dépense introuvable." };
  }

  const result = await rejectExpenseAction(transactionId);

  if (result.success) {
    redirect(`/expenses/${transactionId}?rejected=1`);
  }

  return result;
}

export async function approveExpenseAction(transactionId: string): Promise<ExpenseApprovalActionResult> {
  const auth = await assertCanApproveExpense();

  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const expense = await prisma.transaction.findFirst({
      where: { id: transactionId, type: "EXPENSE", isAdjustment: false },
      select: {
        id: true,
        code: true,
        approvalStatus: true,
        expenseCategory: true,
        totalAmount: true,
        metadata: true,
      },
    });

    if (!expense) {
      return { success: false, error: "Dépense introuvable." };
    }

    if (expense.approvalStatus !== "PENDING") {
      return { success: false, error: "Cette dépense n'est pas en attente d'approbation." };
    }

    const isCashAdvance = isCashAdvanceCategory(expense.expenseCategory);
    const approvedMetadata = isCashAdvance
      ? mergeCashAdvanceWorkflowStatus(expense.metadata, "APPROVED")
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: expense.id },
        data: {
          approvalStatus: "APPROVED",
          approvedById: auth.userId,
          ...(approvedMetadata
            ? { metadata: approvedMetadata as Prisma.InputJsonValue }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          action: isCashAdvance ? "CASH_ADVANCE_APPROVED" : "EXPENSE_APPROVED",
          entity: "Transaction",
          entityId: expense.id,
          userId: auth.userId,
          details: {
            code: expense.code,
            expenseCategory: expense.expenseCategory,
            expenseCategoryLabel: getExpenseCategoryLabel(expense.expenseCategory!),
            totalAmount: decimalToNumber(expense.totalAmount),
            label: (expense.metadata as ExpenseMetadata | null)?.label,
            performedBy: auth.email,
          },
        },
      });
    });

    revalidatePath("/expenses");
    revalidatePath("/expenses/advances");
    revalidatePath("/expenses/approvals");
    revalidatePath(`/expenses/${transactionId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/financier");

    return { success: true };
  } catch (error) {
    console.error("approveExpenseAction failed", error);
    return { success: false, error: "Impossible d'approuver la dépense." };
  }
}

export async function rejectExpenseAction(transactionId: string): Promise<ExpenseApprovalActionResult> {
  const auth = await assertCanApproveExpense();

  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const expense = await prisma.transaction.findFirst({
      where: { id: transactionId, type: "EXPENSE", isAdjustment: false },
      select: {
        id: true,
        code: true,
        approvalStatus: true,
        expenseCategory: true,
        totalAmount: true,
        metadata: true,
      },
    });

    if (!expense) {
      return { success: false, error: "Dépense introuvable." };
    }

    if (expense.approvalStatus !== "PENDING") {
      return { success: false, error: "Cette dépense n'est pas en attente d'approbation." };
    }

    const isCashAdvance = isCashAdvanceCategory(expense.expenseCategory);
    const rejectedMetadata = isCashAdvance
      ? mergeCashAdvanceWorkflowStatus(expense.metadata, "REJECTED")
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: expense.id },
        data: {
          approvalStatus: "REJECTED",
          approvedById: auth.userId,
          ...(rejectedMetadata
            ? { metadata: rejectedMetadata as Prisma.InputJsonValue }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          action: isCashAdvance ? "CASH_ADVANCE_REJECTED" : "EXPENSE_REJECTED",
          entity: "Transaction",
          entityId: expense.id,
          userId: auth.userId,
          details: {
            code: expense.code,
            expenseCategory: expense.expenseCategory,
            expenseCategoryLabel: getExpenseCategoryLabel(expense.expenseCategory!),
            totalAmount: decimalToNumber(expense.totalAmount),
            label: (expense.metadata as ExpenseMetadata | null)?.label,
            performedBy: auth.email,
          },
        },
      });
    });

    revalidatePath("/expenses");
    revalidatePath("/expenses/advances");
    revalidatePath("/expenses/approvals");
    revalidatePath(`/expenses/${transactionId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/financier");

    return { success: true };
  } catch (error) {
    console.error("rejectExpenseAction failed", error);
    return { success: false, error: "Impossible de refuser la dépense." };
  }
}
