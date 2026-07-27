"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import {
  isCashAdvanceCategory,
  mergeCashAdvanceWorkflowStatus,
  parseCashAdvanceMetadata,
} from "@/lib/expenses/cash-advance";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { assertFinancialWriteLocks, assertFiscalPeriodForFinancialWrite } from "@/lib/fiscal-period/lock";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateTransactionCode } from "@/lib/transactions/code";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";
import { parseCreateCashAdvanceRequestFormData } from "@/lib/validations/cash-advance";

export type CashAdvanceActionResult =
  | { success: true; transactionId?: string; code?: string }
  | { success: false; error: string };

export type CashAdvanceFormState = CashAdvanceActionResult | null;

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

function resolveCashAdvanceApprovalOnCreate(creatorCanApprove: boolean, creatorId: string) {
  if (creatorCanApprove) {
    return {
      approvalStatus: "APPROVED" as const,
      approvedById: creatorId,
      workflowStatus: "APPROVED" as const,
    };
  }

  return {
    approvalStatus: "PENDING" as const,
    workflowStatus: "SUBMITTED" as const,
  };
}

export async function createCashAdvanceRequestFormAction(
  _prevState: CashAdvanceFormState,
  formData: FormData
): Promise<CashAdvanceFormState> {
  const result = await createCashAdvanceRequestAction(formData);

  if (result.success && result.transactionId) {
    const query =
      result.pendingApproval === true ? "?created=1&pendingApproval=1" : "?created=1";
    redirect(`/expenses/${result.transactionId}${query}`);
  }

  return result;
}

export async function createCashAdvanceRequestAction(
  formData: FormData
): Promise<CashAdvanceActionResult & { pendingApproval?: boolean }> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE)) {
    return { success: false, error: "Permission insuffisante pour soumettre une avance de caisse." };
  }

  let parsed;

  try {
    parsed = parseCreateCashAdvanceRequestFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const totalAmount = roundMoney(parsed.totalAmount);
  const creatorCanApprove = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);
  const approval = resolveCashAdvanceApprovalOnCreate(creatorCanApprove, session.user.id);

  const metadata = mergeCashAdvanceWorkflowStatus(parsed.metadata, approval.workflowStatus);

  const writeLock = await assertFinancialWriteLocks();

  if (!writeLock.ok) {
    return { success: false, error: writeLock.error };
  }

  try {
    const auditMeta = await captureAuditRequestContext();

    const created = await prisma.$transaction(async (tx) => {
      const code = await generateTransactionCode();

      const transaction = await tx.transaction.create({
        data: {
          code,
          type: "EXPENSE",
          expenseCategory: "AVANCE_CAISSE_NOTE_FRAIS",
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(0),
          remainingAmount: new Prisma.Decimal(totalAmount),
          currency: parsed.currency,
          status: "RESERVE_ACOMPTE_REQUIS",
          paymentMethod: parsed.paymentMethod,
          approvalStatus: approval.approvalStatus,
          approvedById: approval.approvedById,
          metadata: metadata as Prisma.InputJsonValue,
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
        action: "CASH_ADVANCE_REQUESTED",
        entity: "Transaction",
        entityId: transaction.id,
        userId: session.user.id,
        details: {
          code: transaction.code,
          expenseCategory: "AVANCE_CAISSE_NOTE_FRAIS",
          expenseCategoryLabel: getExpenseCategoryLabel("AVANCE_CAISSE_NOTE_FRAIS"),
          totalAmount,
          purpose: parsed.purpose,
          approvalStatus: approval.approvalStatus,
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
          entityId: transaction.id,
          userId: session.user.id,
          details: {
            code: transaction.code,
            totalAmount,
            source: "cash_advance",
            performedBy: session.user.email,
          },
        });
      }

      return transaction;
    });

    revalidatePath("/expenses");
    revalidatePath("/expenses/advances");
    revalidatePath("/expenses/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/financier");

    return {
      success: true,
      transactionId: created.id,
      code: created.code,
      pendingApproval: approval.approvalStatus === "PENDING",
    };
  } catch (error) {
    console.error("createCashAdvanceRequestAction failed", error);
    return { success: false, error: "Impossible d'enregistrer la demande d'avance." };
  }
}

export async function disburseCashAdvanceFormAction(
  _prevState: CashAdvanceFormState,
  formData: FormData
): Promise<CashAdvanceFormState> {
  const transactionId = String(formData.get("transactionId") ?? "");

  if (!transactionId) {
    return { success: false, error: "Demande introuvable." };
  }

  const result = await disburseCashAdvanceAction(transactionId);

  if (result.success) {
    redirect(`/expenses/${transactionId}?disbursed=1`);
  }

  return result;
}

export async function disburseCashAdvanceAction(transactionId: string): Promise<CashAdvanceActionResult> {
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
        approvalStatus: true,
        createdAt: true,
      },
    });

    if (!expense || !isCashAdvanceCategory(expense.expenseCategory)) {
      return { success: false, error: "Demande d'avance introuvable." };
    }

    if (expense.approvalStatus !== "APPROVED") {
      return { success: false, error: "Cette avance doit être approuvée avant décaissement." };
    }

    if (expense.status === "SOLDE") {
      return { success: false, error: "Cette avance est déjà décaissée." };
    }

    const fiscalPeriodLock = await assertFiscalPeriodForFinancialWrite("update", expense.createdAt);

    if (!fiscalPeriodLock.ok) {
      return { success: false, error: fiscalPeriodLock.error };
    }

    const metadata = mergeCashAdvanceWorkflowStatus(expense.metadata, "DISBURSED");
    const totalAmount = roundMoney(decimalToNumber(expense.totalAmount));

    const auditMeta = await captureAuditRequestContext();

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: expense.id },
        data: {
          status: "SOLDE",
          paidAmount: expense.totalAmount,
          remainingAmount: new Prisma.Decimal(0),
          metadata: metadata as Prisma.InputJsonValue,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "CASH_ADVANCE_DISBURSED",
        entity: "Transaction",
        entityId: expense.id,
        userId: session.user.id,
        details: {
          code: expense.code,
          totalAmount,
          purpose: (metadata as ExpenseMetadata).label,
          performedBy: session.user.email,
        },
      });
    });

    revalidatePath("/expenses");
    revalidatePath("/expenses/advances");
    revalidatePath(`/expenses/${transactionId}`);
    revalidatePath("/dashboard/financier");

    return { success: true, transactionId };
  } catch (error) {
    console.error("disburseCashAdvanceAction failed", error);
    return { success: false, error: "Impossible de confirmer le décaissement." };
  }
}
