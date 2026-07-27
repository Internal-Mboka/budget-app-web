"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import {
  appendExpenseAttachment,
  buildExpenseAttachmentUrl,
  EXPENSE_ATTACHMENT_MAX_BYTES,
  getExpenseAttachments,
  isAllowedExpenseAttachmentMimeType,
  type ExpenseAttachment,
} from "@/lib/expenses/attachments";
import {
  isCashAdvanceCategory,
  mergeCashAdvanceWorkflowStatus,
  parseCashAdvanceMetadata,
} from "@/lib/expenses/cash-advance";
import { assertFiscalPeriodForFinancialWrite } from "@/lib/fiscal-period/lock";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { saveExpenseAttachmentFile } from "@/lib/storage/expense-attachments";

function createExpenseAttachmentRecord(input: {
  transactionId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy?: string;
}): ExpenseAttachment {
  const id = randomUUID();

  return {
    id,
    fileName: input.fileName,
    mimeType: input.mimeType,
    url: buildExpenseAttachmentUrl(input.transactionId, id),
    uploadedAt: new Date().toISOString(),
    uploadedBy: input.uploadedBy,
    sizeBytes: input.sizeBytes,
  };
}

export type UploadExpenseAttachmentResult =
  | { success: true; attachmentId: string }
  | { success: false; error: string };

export async function uploadExpenseAttachmentAction(
  formData: FormData
): Promise<UploadExpenseAttachmentResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE)) {
    return { success: false, error: "Permission insuffisante pour joindre une pièce justificative." };
  }

  const transactionId = String(formData.get("transactionId") ?? "").trim();
  const file = formData.get("file");

  if (!transactionId) {
    return { success: false, error: "Dépense introuvable." };
  }

  if (!(file instanceof File) || file.size <= 0) {
    return { success: false, error: "Sélectionnez un fichier à téléverser." };
  }

  if (file.size > EXPENSE_ATTACHMENT_MAX_BYTES) {
    return { success: false, error: "Le fichier ne peut pas dépasser 5 Mo." };
  }

  if (!isAllowedExpenseAttachmentMimeType(file.type)) {
    return { success: false, error: "Format non supporté. Utilisez JPG, PNG, WEBP ou PDF." };
  }

  const expense = await prisma.transaction.findFirst({
    where: { id: transactionId, type: "EXPENSE", isAdjustment: false },
    select: {
      id: true,
      code: true,
      metadata: true,
      expenseCategory: true,
      createdAt: true,
    },
  });

  if (!expense) {
    return { success: false, error: "Dépense introuvable." };
  }

  const fiscalPeriodLock = await assertFiscalPeriodForFinancialWrite("update", expense.createdAt);

  if (!fiscalPeriodLock.ok) {
    return { success: false, error: fiscalPeriodLock.error };
  }

  if (isCashAdvanceCategory(expense.expenseCategory)) {
    const cashAdvance = parseCashAdvanceMetadata(expense.metadata);

    if (cashAdvance?.workflowStatus !== "DISBURSED" && cashAdvance?.workflowStatus !== "JUSTIFIED") {
      return {
        success: false,
        error: "Joignez le reçu uniquement après le décaissement de l'avance.",
      };
    }
  }

  const attachment = createExpenseAttachmentRecord({
    transactionId: expense.id,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedBy: session.user.email ?? undefined,
  });

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const auditMeta = await captureAuditRequestContext();

    await prisma.$transaction(async (tx) => {
      await saveExpenseAttachmentFile({
        transactionId: expense.id,
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        bytes,
      });

      const metadata = appendExpenseAttachment(expense.metadata, attachment);
      const finalMetadata =
        isCashAdvanceCategory(expense.expenseCategory) &&
        parseCashAdvanceMetadata(metadata)?.workflowStatus === "DISBURSED"
          ? mergeCashAdvanceWorkflowStatus(metadata, "JUSTIFIED")
          : metadata;

      await tx.transaction.update({
        where: { id: expense.id },
        data: {
          metadata: finalMetadata as Prisma.InputJsonValue,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "EXPENSE_ATTACHMENT_UPLOADED",
        entity: "Transaction",
        entityId: expense.id,
        userId: session.user.id,
        details: {
          expenseCode: expense.code,
          attachmentId: attachment.id,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          url: attachment.url,
          cashAdvanceJustified:
            isCashAdvanceCategory(expense.expenseCategory) &&
            parseCashAdvanceMetadata(finalMetadata)?.workflowStatus === "JUSTIFIED",
          performedBy: session.user.email,
        },
      });
    });

    revalidatePath(`/expenses/${expense.id}`);
    revalidatePath("/expenses");
    revalidatePath("/expenses/advances");

    return { success: true, attachmentId: attachment.id };
  } catch (error) {
    console.error("uploadExpenseAttachmentAction failed", error);
    return { success: false, error: "Impossible de téléverser la pièce justificative." };
  }
}

export type UploadExpenseAttachmentFormState = UploadExpenseAttachmentResult | null;

export async function uploadExpenseAttachmentFormAction(
  _prevState: UploadExpenseAttachmentFormState,
  formData: FormData
): Promise<UploadExpenseAttachmentFormState> {
  return uploadExpenseAttachmentAction(formData);
}
