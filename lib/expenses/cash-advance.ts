import type { ApprovalStatus, ExpenseCategory } from "@prisma/client";
import { z } from "zod";

import type { ExpenseMetadata } from "@/lib/expenses/metadata";

export const CASH_ADVANCE_WORKFLOW_STATUSES = [
  "SUBMITTED",
  "APPROVED",
  "DISBURSED",
  "JUSTIFIED",
  "REJECTED",
] as const;

export type CashAdvanceWorkflowStatus = (typeof CASH_ADVANCE_WORKFLOW_STATUSES)[number];

export const CASH_ADVANCE_WORKFLOW_LABELS: Record<CashAdvanceWorkflowStatus, string> = {
  SUBMITTED: "Soumise",
  APPROVED: "Approuvée",
  DISBURSED: "Décaissée",
  JUSTIFIED: "Justifiée",
  REJECTED: "Refusée",
};

const cashAdvanceSchema = z.object({
  purpose: z.string().trim().min(1),
  workflowStatus: z.enum(CASH_ADVANCE_WORKFLOW_STATUSES),
});

export type CashAdvanceMetadata = z.infer<typeof cashAdvanceSchema>;

export function isCashAdvanceCategory(category: ExpenseCategory | string | null | undefined): boolean {
  return category === "AVANCE_CAISSE_NOTE_FRAIS";
}

export function parseCashAdvanceMetadata(raw: unknown): CashAdvanceMetadata | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const cashAdvance = record.cashAdvance;

  if (!cashAdvance || typeof cashAdvance !== "object") {
    return null;
  }

  const parsed = cashAdvanceSchema.safeParse(cashAdvance);
  return parsed.success ? parsed.data : null;
}

export function getCashAdvanceWorkflowLabel(status: CashAdvanceWorkflowStatus): string {
  return CASH_ADVANCE_WORKFLOW_LABELS[status];
}

export function buildCashAdvanceMetadata(
  purpose: string,
  workflowStatus: CashAdvanceWorkflowStatus
): CashAdvanceMetadata {
  return {
    purpose,
    workflowStatus,
  };
}

export function mergeCashAdvanceWorkflowStatus(
  metadata: unknown,
  workflowStatus: CashAdvanceWorkflowStatus
): ExpenseMetadata & { cashAdvance: CashAdvanceMetadata } {
  const base =
    metadata && typeof metadata === "object"
      ? (metadata as ExpenseMetadata)
      : { label: "" };

  const cashAdvance = parseCashAdvanceMetadata(metadata);

  if (!cashAdvance) {
    throw new Error("Métadonnées avance de caisse invalides.");
  }

  return {
    ...base,
    cashAdvance: {
      ...cashAdvance,
      workflowStatus,
    },
  };
}

export function resolveCashAdvanceWorkflowStatus(input: {
  cashAdvance: CashAdvanceMetadata | null;
  approvalStatus: ApprovalStatus;
  paymentStatus: string;
}): CashAdvanceWorkflowStatus {
  if (input.approvalStatus === "REJECTED") {
    return "REJECTED";
  }

  if (input.cashAdvance?.workflowStatus) {
    return input.cashAdvance.workflowStatus;
  }

  if (input.paymentStatus === "SOLDE") {
    return "DISBURSED";
  }

  if (input.approvalStatus === "APPROVED") {
    return "APPROVED";
  }

  return "SUBMITTED";
}

export function canUploadCashAdvanceReceipt(workflowStatus: CashAdvanceWorkflowStatus): boolean {
  return workflowStatus === "DISBURSED" || workflowStatus === "JUSTIFIED";
}
