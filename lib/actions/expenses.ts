"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { notifyExpenseThresholdExceeded } from "@/lib/alerts/dispatch";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import { resolveExpenseApprovalOnCreate, requiresExpenseApproval } from "@/lib/expenses/approval";
import { assertFinancialWriteLocks } from "@/lib/fiscal-period/lock";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { parseStaffPayrollMetadata } from "@/lib/expenses/staff-payroll";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateTransactionCode } from "@/lib/transactions/code";
import { roundMoney } from "@/lib/transactions/decimal";
import { parseCreateExpenseFormData } from "@/lib/validations/expense";

export type CreateExpenseActionResult =
  | {
      success: true;
      transaction: {
        id: string;
        code: string;
        expenseCategory: string;
        totalAmount: number;
        pendingApproval?: boolean;
      };
    }
  | { success: false; error: string };

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

export type CreateExpenseFormState = CreateExpenseActionResult | null;

export async function createExpenseFormAction(
  _prevState: CreateExpenseFormState,
  formData: FormData
): Promise<CreateExpenseFormState> {
  const result = await createExpenseAction(formData);

  if (result.success) {
    const query = result.transaction.pendingApproval ? "?created=1&pendingApproval=1" : "?created=1";
    redirect(`/expenses/${result.transaction.id}${query}`);
  }

  return result;
}

export async function createExpenseAction(formData: FormData): Promise<CreateExpenseActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE)) {
    return { success: false, error: "Permission insuffisante pour enregistrer une dépense." };
  }

  let parsed;

  try {
    parsed = parseCreateExpenseFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const totalAmount = roundMoney(parsed.totalAmount);
  const metadata: Prisma.InputJsonValue = parsed.metadata as Prisma.InputJsonValue;
  const creatorCanApprove = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);
  const approval = resolveExpenseApprovalOnCreate(totalAmount, creatorCanApprove, session.user.id);

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
          expenseCategory: parsed.expenseCategory,
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(totalAmount),
          remainingAmount: new Prisma.Decimal(0),
          currency: parsed.currency,
          status: "SOLDE",
          paymentMethod: parsed.paymentMethod,
          approvalStatus: approval.approvalStatus,
          approvedById: approval.approvedById,
          metadata,
          createdById: session.user.id,
        },
        select: {
          id: true,
          code: true,
          expenseCategory: true,
          totalAmount: true,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "EXPENSE_CREATED",
        entity: "Transaction",
        entityId: transaction.id,
        userId: session.user.id,
        details: {
          code: transaction.code,
          expenseCategory: transaction.expenseCategory,
          expenseCategoryLabel: getExpenseCategoryLabel(transaction.expenseCategory!),
          totalAmount,
          paymentMethod: parsed.paymentMethod,
          label: parsed.metadata.label,
          metadata: parsed.metadata as ExpenseMetadata,
          staffPayroll: parseStaffPayrollMetadata(parsed.metadata),
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
          entityId: transaction.id,
          userId: session.user.id,
          details: {
            code: transaction.code,
            totalAmount,
            expenseCategory: transaction.expenseCategory,
            performedBy: session.user.email,
          },
        });
      }

      return transaction;
    });

    revalidatePath("/expenses");
    revalidatePath("/expenses/staff");
    revalidatePath("/expenses/approvals");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/financier");

    if (requiresExpenseApproval(totalAmount)) {
      void notifyExpenseThresholdExceeded({
        transactionId: created.id,
        code: created.code,
        totalAmount,
        expenseCategoryLabel: getExpenseCategoryLabel(created.expenseCategory!),
        creatorEmail: session.user.email ?? "",
        approvalPending: approval.approvalStatus === "PENDING",
        triggeredByUserId: session.user.id,
      });
    }

    return {
      success: true,
      transaction: {
        id: created.id,
        code: created.code,
        expenseCategory: created.expenseCategory!,
        totalAmount,
        pendingApproval: approval.approvalStatus === "PENDING",
      },
    };
  } catch (error) {
    console.error("createExpenseAction failed", error);
    return { success: false, error: "Impossible d'enregistrer la dépense." };
  }
}
