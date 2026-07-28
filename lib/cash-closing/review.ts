import type { ClosingReviewStatus } from "@prisma/client";

export const CLOSING_REVIEW_STATUS_LABELS: Record<ClosingReviewStatus, string> = {
  PENDING_REVIEW: "En attente de revue PDG",
  APPROVED: "Écart analysé et validé",
  RESOLVED: "Écart régularisé",
};

export function getClosingReviewStatusLabel(status: ClosingReviewStatus): string {
  return CLOSING_REVIEW_STATUS_LABELS[status];
}

export function isClosingReviewPending(status: ClosingReviewStatus): boolean {
  return status === "PENDING_REVIEW";
}

export function isClosingReviewResolved(status: ClosingReviewStatus): boolean {
  return status === "RESOLVED";
}
