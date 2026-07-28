"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasAnyPermission } from "@/lib/auth/session";
import { notifyReceivableReminder } from "@/lib/email/receivable-reminders";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { formatDueLabel, getRevenueDueDate, isRevenueOverdue } from "@/lib/revenues/due-date";

export type ReceivableReminderFormState =
  | { success: true; message: string }
  | { success: false; error: string }
  | null;

const reminderSchema = z.object({
  transactionId: z.string().trim().min(1, "Transaction requise."),
});

async function assertReceivableReminderAccess() {
  const session = await getSession();

  if (
    !session?.user ||
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
      PERMISSIONS.FINANCE_VALIDATE_PAYMENT,
    ])
  ) {
    return { ok: false as const, error: "Accès refusé." };
  }

  return { ok: true as const, session };
}

export async function sendReceivableReminderFormAction(
  _previousState: ReceivableReminderFormState,
  formData: FormData
): Promise<ReceivableReminderFormState> {
  const access = await assertReceivableReminderAccess();

  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const parsed = reminderSchema.safeParse({
    transactionId: formData.get("transactionId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: parsed.data.transactionId,
      type: "REVENUE",
      isAdjustment: false,
      status: "RESERVE_ACOMPTE_REQUIS",
      remainingAmount: { gt: 0 },
    },
    select: {
      id: true,
      code: true,
      revenueCategory: true,
      remainingAmount: true,
      status: true,
      metadata: true,
      createdAt: true,
      client: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!transaction || !transaction.revenueCategory) {
    return { success: false, error: "Créance introuvable ou déjà soldée." };
  }

  const dueDate = getRevenueDueDate(transaction.revenueCategory, transaction.metadata, transaction.createdAt);

  if (!isRevenueOverdue(transaction.status, dueDate)) {
    return { success: false, error: "Cette créance n'est pas en souffrance." };
  }

  if (!transaction.client?.email) {
    return {
      success: false,
      error: "Aucune adresse e-mail enregistrée pour ce client — ajoutez-la sur la fiche client.",
    };
  }

  const remainingAmount = decimalToNumber(transaction.remainingAmount);
  const dueLabel = formatDueLabel(dueDate);
  const requestMeta = await captureAuditRequestContext();

  await notifyReceivableReminder({
    clientEmail: transaction.client.email,
    clientName: transaction.client.name,
    transactionCode: transaction.code,
    remainingAmount,
    dueLabel,
  });

  await writeAuditLog({
    action: "RECEIVABLE_REMINDER_SENT",
    entity: "Transaction",
    entityId: transaction.id,
    userId: access.session.user.id,
    requestMeta,
    details: {
      code: transaction.code,
      clientName: transaction.client.name,
      clientEmail: transaction.client.email,
      remainingAmount,
      dueLabel,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/financier");
  revalidatePath("/dashboard/creances");

  return {
    success: true,
    message: `Rappel enregistré pour ${transaction.client.email}.`,
  };
}
