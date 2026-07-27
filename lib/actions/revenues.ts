"use server";

import type { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import type { RevenueMetadata } from "@/lib/revenues/metadata";
import {
  appendRevenuePaymentHistory,
  createInitialPaymentEntry,
} from "@/lib/revenues/payment-history";
import { findRevenueBookingConflict } from "@/lib/revenues/conflicts";
import { assertTodayCashDayOpen } from "@/lib/cash-closing/lock";
import { resolvePaymentStatus } from "@/lib/revenues/status";
import { generateTransactionCode } from "@/lib/transactions/code";
import { roundMoney } from "@/lib/transactions/decimal";
import { parseCreateRevenueFormData } from "@/lib/validations/revenue";

export type CreateRevenueActionResult =
  | {
      success: true;
      transaction: {
        id: string;
        code: string;
        revenueCategory: string;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
        status: string;
        clientId: string | null;
      };
    }
  | { success: false; error: string };

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

export type CreateRevenueFormState = CreateRevenueActionResult | null;

export async function createRevenueFormAction(
  _prevState: CreateRevenueFormState,
  formData: FormData
): Promise<CreateRevenueFormState> {
  const result = await createRevenueAction(formData);

  if (result.success) {
    redirect(`/revenues/${result.transaction.id}?created=1`);
  }

  return result;
}

export async function createRevenueAction(formData: FormData): Promise<CreateRevenueActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_REVENUE)) {
    return { success: false, error: "Permission insuffisante pour enregistrer un revenu." };
  }

  const allowDiscount = hasPermission(session.user.permissions, PERMISSIONS.DASHBOARD_FULL);

  let parsed;

  try {
    parsed = parseCreateRevenueFormData(formData, { allowDiscount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const client = await prisma.client.findUnique({
    where: { id: parsed.clientId },
    select: { id: true, name: true },
  });

  if (!client) {
    return { success: false, error: "Client introuvable." };
  }

  const conflict = await findRevenueBookingConflict(parsed.revenueCategory, parsed.metadata);

  if (conflict) {
    return { success: false, error: conflict.message };
  }

  const cashDayLock = await assertTodayCashDayOpen();
  if (!cashDayLock.ok) {
    return { success: false, error: cashDayLock.error };
  }

  const totalAmount = roundMoney(parsed.totalAmount);
  const paidAmount = roundMoney(parsed.paidAmount);
  const remainingAmount = roundMoney(Math.max(totalAmount - paidAmount, 0));
  const status = resolvePaymentStatus(totalAmount, paidAmount);

  const metadataBase: Prisma.InputJsonValue = {
    ...(parsed.metadata as Record<string, unknown>),
    ...(parsed.notes ? { notes: parsed.notes } : {}),
  };

  const initialPaymentEntry = createInitialPaymentEntry({
    amount: paidAmount,
    paymentMethod: parsed.paymentMethod ?? null,
    recordedBy: session.user.email ?? undefined,
    paidAfter: paidAmount,
    remainingAfter: remainingAmount,
  });

  const metadata: Prisma.InputJsonValue = initialPaymentEntry
    ? (appendRevenuePaymentHistory(metadataBase, initialPaymentEntry) as Prisma.InputJsonValue)
    : metadataBase;

  try {
    const auditMeta = await captureAuditRequestContext();

    const created = await prisma.$transaction(async (tx) => {
      const code = await generateTransactionCode();

      const transaction = await tx.transaction.create({
        data: {
          code,
          type: "REVENUE",
          revenueCategory: parsed.revenueCategory,
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(paidAmount),
          remainingAmount: new Prisma.Decimal(remainingAmount),
          currency: parsed.currency,
          status: status as PaymentStatus,
          paymentMethod: parsed.paymentMethod ?? null,
          metadata,
          clientId: client.id,
          createdById: session.user.id,
        },
        select: {
          id: true,
          code: true,
          revenueCategory: true,
          totalAmount: true,
          paidAmount: true,
          remainingAmount: true,
          status: true,
          clientId: true,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "REVENUE_CREATED",
        entity: "Transaction",
        entityId: transaction.id,
        userId: session.user.id,
        details: {
          code: transaction.code,
          revenueCategory: transaction.revenueCategory,
          revenueCategoryLabel: getRevenueCategoryLabel(transaction.revenueCategory!),
          totalAmount,
          paidAmount,
          remainingAmount,
          status,
          clientId: client.id,
          clientName: client.name,
          metadata: parsed.metadata as RevenueMetadata,
          performedBy: session.user.email,
        },
      });

      return transaction;
    });

    revalidatePath("/revenues");
    revalidatePath("/clients");
    revalidatePath(`/clients/${client.id}`);

    return {
      success: true,
      transaction: {
        id: created.id,
        code: created.code,
        revenueCategory: created.revenueCategory!,
        totalAmount,
        paidAmount,
        remainingAmount,
        status: created.status,
        clientId: created.clientId,
      },
    };
  } catch (error) {
    console.error("createRevenueAction failed", error);

    if (isRetryableDbConnectionError(error)) {
      return {
        success: false,
        error: "Connexion base de données instable. Réessayez dans quelques secondes.",
      };
    }

    return { success: false, error: "Impossible d'enregistrer le revenu." };
  }
}

function isRetryableDbConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ETIMEDOUT|NeonDbError|Error connecting to database|ErrorEvent/i.test(message);
}
