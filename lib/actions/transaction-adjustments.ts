"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog, buildAuditChangeDetails } from "@/lib/audit";
import { notifyHighValueAdjustment } from "@/lib/alerts/dispatch";
import { getHighValueAdjustmentThreshold } from "@/lib/alerts/config";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import {
  buildAdjustmentMetadata,
  getRemainingAdjustableAmount,
  type AdjustmentKind,
} from "@/lib/transactions/adjustments";
import { generateTransactionCode } from "@/lib/transactions/code";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";
import { parseCreateTransactionAdjustmentFormData } from "@/lib/validations/transaction-adjustment";

export type CreateTransactionAdjustmentResult =
  | {
      success: true;
      adjustment: {
        id: string;
        code: string;
        parentTransactionId: string;
        parentType: "REVENUE" | "EXPENSE";
        amount: number;
      };
    }
  | { success: false; error: string };

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

function getParentDetailPath(type: "REVENUE" | "EXPENSE", id: string): string {
  return type === "REVENUE" ? `/revenues/${id}` : `/expenses/${id}`;
}

function getParentLabel(metadata: unknown, fallback: string): string {
  if (!metadata || typeof metadata !== "object") {
    return fallback;
  }

  const record = metadata as Record<string, unknown>;
  const label = record.label;

  return typeof label === "string" && label.trim() ? label.trim() : fallback;
}

export type CreateTransactionAdjustmentFormState = CreateTransactionAdjustmentResult | null;

export async function createTransactionAdjustmentFormAction(
  _prevState: CreateTransactionAdjustmentFormState,
  formData: FormData
): Promise<CreateTransactionAdjustmentFormState> {
  const result = await createTransactionAdjustmentAction(formData);

  if (result.success) {
    redirect(`${getParentDetailPath(result.adjustment.parentType, result.adjustment.parentTransactionId)}?adjusted=1`);
  }

  return result;
}

export async function createTransactionAdjustmentAction(
  formData: FormData
): Promise<CreateTransactionAdjustmentResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CANCEL_ADJUSTMENT)) {
    return { success: false, error: "Permission insuffisante pour émettre un avoir ou une régularisation." };
  }

  let parsed;

  try {
    parsed = parseCreateTransactionAdjustmentFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const parent = await prisma.transaction.findFirst({
    where: { id: parsed.transactionId, isAdjustment: false },
    select: {
      id: true,
      code: true,
      type: true,
      revenueCategory: true,
      expenseCategory: true,
      totalAmount: true,
      currency: true,
      paymentMethod: true,
      metadata: true,
      clientId: true,
      client: { select: { id: true, name: true } },
    },
  });

  if (!parent) {
    return { success: false, error: "Enregistrement introuvable ou déjà régularisé." };
  }

  const existingAdjustments = await prisma.transaction.findMany({
    where: { parentTransactionId: parent.id, isAdjustment: true },
    select: { totalAmount: true },
  });

  const parentTotal = decimalToNumber(parent.totalAmount);
  const remainingAdjustable = getRemainingAdjustableAmount(
    parentTotal,
    existingAdjustments.map((entry) => ({ totalAmount: decimalToNumber(entry.totalAmount) }))
  );

  if (remainingAdjustable <= 0) {
    return { success: false, error: "Cet enregistrement est déjà entièrement régularisé." };
  }

  const mode = parsed.mode as AdjustmentKind;
  let amount = mode === "FULL" ? remainingAdjustable : roundMoney(parsed.amount ?? 0);

  if (mode === "PARTIAL") {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Indiquez un montant de régularisation valide." };
    }

    if (amount > remainingAdjustable) {
      return {
        success: false,
        error: `Le montant ne peut pas dépasser ${remainingAdjustable.toFixed(2)}.`,
      };
    }
  }

  amount = roundMoney(amount);

  const parentLabel = getParentLabel(parent.metadata, parent.code);
  const adjustmentMetadata = buildAdjustmentMetadata({
    reason: parsed.reason,
    kind: mode,
    parentTransactionId: parent.id,
    parentCode: parent.code,
  });

  const metadata: Prisma.InputJsonValue = {
    label: `Avoir / régularisation — ${parentLabel}`,
    ...adjustmentMetadata,
  };

  try {
    const auditMeta = await captureAuditRequestContext();

    const created = await prisma.$transaction(async (tx) => {
      const code = await generateTransactionCode();

      const adjustment = await tx.transaction.create({
        data: {
          code,
          type: parent.type,
          revenueCategory: parent.revenueCategory,
          expenseCategory: parent.expenseCategory,
          totalAmount: new Prisma.Decimal(amount),
          paidAmount: new Prisma.Decimal(amount),
          remainingAmount: new Prisma.Decimal(0),
          currency: parent.currency,
          status: "SOLDE",
          paymentMethod: parent.paymentMethod,
          metadata,
          isAdjustment: true,
          parentTransactionId: parent.id,
          clientId: parent.clientId,
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
        action: "TRANSACTION_ADJUSTMENT_CREATED",
        entity: "Transaction",
        entityId: adjustment.id,
        userId: session.user.id,
        details: {
          ...buildAuditChangeDetails(
            {
              parentCode: parent.code,
              parentTotal,
              remainingAdjustable,
            },
            {
              parentCode: parent.code,
              adjustmentCode: adjustment.code,
              adjustmentAmount: amount,
              remainingAfter: roundMoney(remainingAdjustable - amount),
            }
          ),
          parentTransactionId: parent.id,
          parentType: parent.type,
          reason: parsed.reason,
          kind: mode,
          revenueCategory: parent.revenueCategory,
          revenueCategoryLabel: parent.revenueCategory
            ? getRevenueCategoryLabel(parent.revenueCategory)
            : undefined,
          expenseCategory: parent.expenseCategory,
          expenseCategoryLabel: parent.expenseCategory
            ? getExpenseCategoryLabel(parent.expenseCategory)
            : undefined,
          clientId: parent.clientId,
          clientName: parent.client?.name,
          performedBy: session.user.email,
        },
      });

      return adjustment;
    });

    revalidatePath(getParentDetailPath(parent.type, parent.id));
    revalidatePath(parent.type === "REVENUE" ? "/revenues" : "/expenses");
    if (parent.clientId) {
      revalidatePath(`/clients/${parent.clientId}`);
    }

    if (amount >= getHighValueAdjustmentThreshold()) {
      void notifyHighValueAdjustment({
        adjustmentId: created.id,
        adjustmentCode: created.code,
        parentCode: parent.code,
        amount,
        reason: parsed.reason,
        performerEmail: session.user.email ?? "",
        triggeredByUserId: session.user.id,
      });
    }

    return {
      success: true,
      adjustment: {
        id: created.id,
        code: created.code,
        parentTransactionId: parent.id,
        parentType: parent.type,
        amount,
      },
    };
  } catch (error) {
    console.error("createTransactionAdjustmentAction failed", error);
    return { success: false, error: "Impossible d'émettre la régularisation." };
  }
}
