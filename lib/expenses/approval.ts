import type { ApprovalStatus } from "@prisma/client";

export const DEFAULT_EXPENSE_APPROVAL_THRESHOLD_USD = 500;

export function getExpenseApprovalThreshold(): number {
  const raw = process.env.EXPENSE_APPROVAL_THRESHOLD_USD;

  if (!raw) {
    return DEFAULT_EXPENSE_APPROVAL_THRESHOLD_USD;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EXPENSE_APPROVAL_THRESHOLD_USD;
}

export function requiresExpenseApproval(totalAmount: number): boolean {
  return totalAmount >= getExpenseApprovalThreshold();
}

export type ExpenseApprovalResolution = {
  approvalStatus: ApprovalStatus;
  approvedById?: string;
};

export function resolveExpenseApprovalOnCreate(
  totalAmount: number,
  creatorCanApprove: boolean,
  creatorId: string
): ExpenseApprovalResolution {
  if (!requiresExpenseApproval(totalAmount)) {
    return { approvalStatus: "NOT_REQUIRED" };
  }

  if (creatorCanApprove) {
    return { approvalStatus: "APPROVED", approvedById: creatorId };
  }

  return { approvalStatus: "PENDING" };
}

const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  NOT_REQUIRED: "Aucune approbation requise",
  PENDING: "En attente d'approbation PDG",
  APPROVED: "Approuvée par la direction",
  REJECTED: "Refusée par la direction",
};

export function getApprovalStatusLabel(status: ApprovalStatus): string {
  return APPROVAL_STATUS_LABELS[status];
}

export function isApprovalPending(status: ApprovalStatus): boolean {
  return status === "PENDING";
}

export function isApprovalRejected(status: ApprovalStatus): boolean {
  return status === "REJECTED";
}
