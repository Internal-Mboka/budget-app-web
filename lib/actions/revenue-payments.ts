"use server";

import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import {
  appendRevenuePaymentHistory,
  createInstallmentPaymentEntry,
} from "@/lib/revenues/payment-history";
import { assertTodayCashDayOpen } from "@/lib/cash-closing/lock";
import { withRevenueRealized, parseRevenueFulfillment } from "@/lib/revenues/fulfillment";
import { resolvePaymentStatus } from "@/lib/revenues/status";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";
import {
  parseMarkRevenueRealizedFormData,
  parseRecordRevenuePaymentFormData,
} from "@/lib/validations/revenue-payment";

export type RevenuePaymentActionResult =
  | {
      success: true;
      transaction: {
        id: string;
        code: string;
        paidAmount: number;
        remainingAmount: number;
        status: PaymentStatus;
      };
    }
  | { success: false; error: string };

export type MarkRevenueRealizedActionResult =
  | { success: true; realizedAt: string }
  | { success: false; error: string };

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

async function assertRevenueWriteAccess() {
  const session = await getSession();

  if (!session?.user) {
    return { ok: false as const, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_REVENUE)) {
    return { ok: false as const, error: "Permission insuffisante." };
  }

  return { ok: true as const, session };
}

async function loadRevenueTransaction(transactionId: string) {
  return prisma.transaction.findFirst({
    where: { id: transactionId, type: "REVENUE" },
    select: {
      id: true,
      code: true,
      revenueCategory: true,
      totalAmount: true,
      paidAmount: true,
      remainingAmount: true,
      status: true,
      paymentMethod: true,
      metadata: true,
      clientId: true,
      client: { select: { id: true, name: true } },
    },
  });
}

export async function recordRevenuePaymentAction(
  formData: FormData
): Promise<RevenuePaymentActionResult> {
  const access = await assertRevenueWriteAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  let parsed;

  try {
    parsed = parseRecordRevenuePaymentFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const transaction = await loadRevenueTransaction(parsed.transactionId);

  if (!transaction) {
    return { success: false, error: "Revenu introuvable." };
  }

  if (transaction.status === "LITIGE_ANNULE") {
    return { success: false, error: "Impossible d'encaisser une transaction annulée." };
  }

  const cashDayLock = await assertTodayCashDayOpen();
  if (!cashDayLock.ok) {
    return { success: false, error: cashDayLock.error };
  }

  const totalAmount = decimalToNumber(transaction.totalAmount);
  const currentPaid = decimalToNumber(transaction.paidAmount);
  const newPaidAmount = roundMoney(currentPaid + parsed.paymentAmount);

  if (newPaidAmount > totalAmount) {
    return {
      success: false,
      error: `Le paiement dépasse le reste à payer (${roundMoney(totalAmount - currentPaid).toFixed(2)}).`,
    };
  }

  const remainingAmount = roundMoney(Math.max(totalAmount - newPaidAmount, 0));
  const status = resolvePaymentStatus(totalAmount, newPaidAmount);

  const paymentEntry = createInstallmentPaymentEntry({
    amount: parsed.paymentAmount,
    paymentMethod: parsed.paymentMethod ?? transaction.paymentMethod,
    recordedBy: access.session.user.email ?? undefined,
    paidAfter: newPaidAmount,
    remainingAfter: remainingAmount,
  });

  const metadata = appendRevenuePaymentHistory(transaction.metadata, paymentEntry);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          paidAmount: new Prisma.Decimal(newPaidAmount),
          remainingAmount: new Prisma.Decimal(remainingAmount),
          status,
          metadata: metadata as Prisma.InputJsonValue,
          ...(parsed.paymentMethod ? { paymentMethod: parsed.paymentMethod as PaymentMethod } : {}),
        },
        select: {
          id: true,
          code: true,
          paidAmount: true,
          remainingAmount: true,
          status: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "REVENUE_PAYMENT_RECORDED",
          entity: "Transaction",
          entityId: saved.id,
          userId: access.session.user.id,
          details: {
            code: transaction.code,
            revenueCategory: transaction.revenueCategory,
            revenueCategoryLabel: getRevenueCategoryLabel(transaction.revenueCategory!),
            paymentAmount: parsed.paymentAmount,
            previousPaidAmount: currentPaid,
            paidAmount: newPaidAmount,
            remainingAmount,
            status,
            paymentMethod: parsed.paymentMethod ?? transaction.paymentMethod,
            clientId: transaction.clientId,
            clientName: transaction.client?.name,
            performedBy: access.session.user.email,
          },
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
        paidAmount: decimalToNumber(updated.paidAmount),
        remainingAmount: decimalToNumber(updated.remainingAmount),
        status: updated.status,
      },
    };
  } catch (error) {
    console.error("recordRevenuePaymentAction failed", error);
    return { success: false, error: "Impossible d'enregistrer le paiement." };
  }
}

export type RecordRevenuePaymentFormState = RevenuePaymentActionResult | null;

export async function recordRevenuePaymentFormAction(
  _prevState: RecordRevenuePaymentFormState,
  formData: FormData
): Promise<RecordRevenuePaymentFormState> {
  const result = await recordRevenuePaymentAction(formData);

  if (result.success && result.transaction.status === "SOLDE") {
    redirect(`/revenues/${result.transaction.id}?paid=solde`);
  }

  if (result.success) {
    redirect(`/revenues/${result.transaction.id}?paid=partial`);
  }

  return result;
}

export async function markRevenueRealizedAction(
  formData: FormData
): Promise<MarkRevenueRealizedActionResult> {
  const access = await assertRevenueWriteAccess();
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  let parsed;

  try {
    parsed = parseMarkRevenueRealizedFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const transaction = await loadRevenueTransaction(parsed.transactionId);

  if (!transaction) {
    return { success: false, error: "Revenu introuvable." };
  }

  if (transaction.status === "LITIGE_ANNULE") {
    return { success: false, error: "Impossible de marquer une transaction annulée." };
  }

  const fulfillment = parseRevenueFulfillment(transaction.metadata);

  if (fulfillment.fulfillmentStatus === "REALIZED") {
    return { success: false, error: "Cette prestation est déjà marquée comme réalisée." };
  }

  const metadata = withRevenueRealized(transaction.metadata);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { metadata: metadata as Prisma.InputJsonValue },
      });

      await tx.auditLog.create({
        data: {
          action: "REVENUE_REALIZED",
          entity: "Transaction",
          entityId: transaction.id,
          userId: access.session.user.id,
          details: {
            code: transaction.code,
            revenueCategory: transaction.revenueCategory,
            revenueCategoryLabel: getRevenueCategoryLabel(transaction.revenueCategory!),
            realizedAt: String(metadata.realizedAt),
            clientId: transaction.clientId,
            clientName: transaction.client?.name,
            performedBy: access.session.user.email,
          },
        },
      });
    });

    revalidatePath("/revenues");
    revalidatePath(`/revenues/${transaction.id}`);

    return { success: true, realizedAt: String(metadata.realizedAt) };
  } catch (error) {
    console.error("markRevenueRealizedAction failed", error);
    return { success: false, error: "Impossible de marquer la prestation comme réalisée." };
  }
}

export type MarkRevenueRealizedFormState = MarkRevenueRealizedActionResult | null;

export async function markRevenueRealizedFormAction(
  _prevState: MarkRevenueRealizedFormState,
  formData: FormData
): Promise<MarkRevenueRealizedFormState> {
  const result = await markRevenueRealizedAction(formData);

  if (result.success) {
    redirect(`/revenues/${String(formData.get("transactionId"))}?realized=1`);
  }

  return result;
}
