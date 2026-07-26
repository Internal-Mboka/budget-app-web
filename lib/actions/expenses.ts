"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
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
    redirect(`/expenses/${result.transaction.id}?created=1`);
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

  try {
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

      await tx.auditLog.create({
        data: {
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
            performedBy: session.user.email,
          },
        },
      });

      return transaction;
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    return {
      success: true,
      transaction: {
        id: created.id,
        code: created.code,
        expenseCategory: created.expenseCategory!,
        totalAmount,
      },
    };
  } catch (error) {
    console.error("createExpenseAction failed", error);
    return { success: false, error: "Impossible d'enregistrer la dépense." };
  }
}
