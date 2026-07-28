"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import {
  computeCancellationAmounts,
  withRevenueCancellation,
  type RevenueCancellationMetadata,
} from "@/lib/revenues/cancellation";
import { parseRevenueFulfillment } from "@/lib/revenues/fulfillment";
import { canCancelRevenue, isBookableRevenueCategory } from "@/lib/revenues/status";
import { assertFiscalPeriodForFinancialWrite } from "@/lib/fiscal-period/lock";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { parseCancelRevenueFormData } from "@/lib/validations/revenue-cancellation";

export type CancelRevenueActionResult =
  | {
      success: true;
      transaction: {
        id: string;
        code: string;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
      };
    }
  | { success: false; error: string };

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

async function assertCancelAccess() {
  const session = await getSession();

  if (!session?.user) {
    return { ok: false as const, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CANCEL_ADJUSTMENT)) {
    return { ok: false as const, error: "Permission insuffisante pour annuler un revenu." };
  }

  return { ok: true as const, session };
}

export async function cancelRevenueAction(formData: FormData): Promise<CancelRevenueActionResult> {
  const access = await assertCancelAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  let parsed;

  try {
    parsed = parseCancelRevenueFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: parsed.transactionId, type: "REVENUE" },
    select: {
      id: true,
      code: true,
      revenueCategory: true,
      totalAmount: true,
      paidAmount: true,
      remainingAmount: true,
      status: true,
      metadata: true,
      createdAt: true,
      clientId: true,
      client: { select: { id: true, name: true } },
    },
  });

  if (!transaction) {
    return { success: false, error: "Revenu introuvable." };
  }

  if (transaction.status === "LITIGE_ANNULE") {
    return { success: false, error: "Ce revenu est déjà annulé." };
  }

  const fulfillment = parseRevenueFulfillment(transaction.metadata);

  if (!canCancelRevenue(transaction.status, fulfillment, transaction.revenueCategory)) {
    return {
      success: false,
      error: isBookableRevenueCategory(transaction.revenueCategory)
        ? "Impossible d'annuler une prestation soldée et déjà réalisée."
        : "Impossible d'annuler un revenu déjà soldé. Utilisez un avoir si besoin.",
    };
  }

  const fiscalPeriodLock = await assertFiscalPeriodForFinancialWrite("update", transaction.createdAt);

  if (!fiscalPeriodLock.ok) {
    return { success: false, error: fiscalPeriodLock.error };
  }

  const currentTotal = decimalToNumber(transaction.totalAmount);
  const currentPaid = decimalToNumber(transaction.paidAmount);

  if (parsed.penaltyMode === "KEEP_DEPOSIT" && currentPaid <= 0) {
    return { success: false, error: "Aucun acompte à conserver." };
  }

  if (parsed.penaltyMode === "CUSTOM") {
    if (parsed.customPenaltyAmount == null) {
      return { success: false, error: "Indiquez le montant de la pénalité." };
    }

    if (parsed.customPenaltyAmount <= 0) {
      return { success: false, error: "La pénalité doit être supérieure à 0." };
    }

    if (parsed.customPenaltyAmount > currentPaid) {
      return {
        success: false,
        error: `La pénalité ne peut pas dépasser l'acompte perçu (${currentPaid.toFixed(2)}).`,
      };
    }
  }

  const amounts = computeCancellationAmounts(
    currentTotal,
    currentPaid,
    parsed.penaltyMode,
    parsed.customPenaltyAmount
  );

  const cancellation: RevenueCancellationMetadata = {
    reason: parsed.reason,
    cancelledAt: new Date().toISOString(),
    penaltyMode: parsed.penaltyMode,
    ...(parsed.penaltyMode === "CUSTOM" ? { penaltyAmount: parsed.customPenaltyAmount } : {}),
    previousTotalAmount: currentTotal,
    previousPaidAmount: currentPaid,
    penaltyKept: amounts.penaltyKept,
    refundedAmount: amounts.refundedAmount,
  };

  const metadata = withRevenueCancellation(transaction.metadata, cancellation);

  try {
    const auditMeta = await captureAuditRequestContext();

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          totalAmount: new Prisma.Decimal(amounts.totalAmount),
          paidAmount: new Prisma.Decimal(amounts.paidAmount),
          remainingAmount: new Prisma.Decimal(amounts.remainingAmount),
          status: "LITIGE_ANNULE",
          metadata: metadata as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          code: true,
          totalAmount: true,
          paidAmount: true,
          remainingAmount: true,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "REVENUE_CANCELLED",
        entity: "Transaction",
        entityId: saved.id,
        userId: access.session.user.id,
        details: {
          code: transaction.code,
          revenueCategory: transaction.revenueCategory,
          revenueCategoryLabel: getRevenueCategoryLabel(transaction.revenueCategory!),
          reason: parsed.reason,
          penaltyMode: parsed.penaltyMode,
          penaltyKept: amounts.penaltyKept,
          refundedAmount: amounts.refundedAmount,
          previousTotalAmount: currentTotal,
          previousPaidAmount: currentPaid,
          clientId: transaction.clientId,
          clientName: transaction.client?.name,
          performedBy: access.session.user.email,
        },
      });

      return saved;
    });

    revalidatePath("/revenues");
    revalidatePath(`/revenues/${transaction.id}`);
    if (transaction.clientId) {
      revalidatePath(`/clients/${transaction.clientId}`);
    }

    return {
      success: true,
      transaction: {
        id: updated.id,
        code: updated.code,
        totalAmount: decimalToNumber(updated.totalAmount),
        paidAmount: decimalToNumber(updated.paidAmount),
        remainingAmount: decimalToNumber(updated.remainingAmount),
      },
    };
  } catch (error) {
    console.error("cancelRevenueAction failed", error);
    return { success: false, error: "Impossible d'annuler le revenu." };
  }
}

export type CancelRevenueFormState = CancelRevenueActionResult | null;

export async function cancelRevenueFormAction(
  _prevState: CancelRevenueFormState,
  formData: FormData
): Promise<CancelRevenueFormState> {
  const result = await cancelRevenueAction(formData);

  if (result.success) {
    redirect(`/revenues/${result.transaction.id}?cancelled=1`);
  }

  return result;
}
