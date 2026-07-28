import { z } from "zod";

export const EXPENSE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export const EXPENSE_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type ExpenseAttachmentMimeType = (typeof EXPENSE_ATTACHMENT_ALLOWED_MIME_TYPES)[number];

const expenseAttachmentSchema = z.object({
  id: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  url: z.string().trim().min(1),
  uploadedAt: z.string().trim().min(1),
  uploadedBy: z.string().trim().optional(),
  sizeBytes: z.number().int().positive(),
});

export type ExpenseAttachment = z.infer<typeof expenseAttachmentSchema>;

export function buildExpenseAttachmentUrl(transactionId: string, attachmentId: string): string {
  return `/api/expenses/${transactionId}/attachments/${attachmentId}`;
}

export function getExpenseAttachments(metadata: unknown): ExpenseAttachment[] {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const record = metadata as Record<string, unknown>;
  const attachments = record.attachments;

  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .map((entry) => {
      const parsed = expenseAttachmentSchema.safeParse(entry);
      return parsed.success ? parsed.data : null;
    })
    .filter((entry): entry is ExpenseAttachment => entry !== null);
}

export function appendExpenseAttachment(
  metadata: unknown,
  attachment: ExpenseAttachment
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" ? ({ ...(metadata as Record<string, unknown>) } as Record<string, unknown>) : {};

  const existing = getExpenseAttachments(base);

  return {
    ...base,
    attachments: [...existing, attachment],
  };
}

export function isAllowedExpenseAttachmentMimeType(mimeType: string): mimeType is ExpenseAttachmentMimeType {
  return EXPENSE_ATTACHMENT_ALLOWED_MIME_TYPES.includes(mimeType as ExpenseAttachmentMimeType);
}

export function sanitizeAttachmentFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/[^\w.\-() ]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

export function formatAttachmentSize(sizeBytes: number): string {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} Ko`;
}

export function isImageAttachment(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
