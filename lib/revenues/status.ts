import type { PaymentStatus, RevenueCategory } from "@prisma/client";

import { roundMoney } from "@/lib/transactions/decimal";
import { getPaymentStatusLabel } from "@/lib/transactions/labels";

import type { RevenueFulfillmentMetadata } from "@/lib/revenues/fulfillment";

const BOOKABLE_REVENUE_CATEGORIES = new Set<RevenueCategory>([
  "STUDIO_SESSION",
  "LOCATION_VEHICULE",
]);

export function isBookableRevenueCategory(
  revenueCategory: RevenueCategory | string | null | undefined
): boolean {
  return Boolean(revenueCategory && BOOKABLE_REVENUE_CATEGORIES.has(revenueCategory as RevenueCategory));
}

export function resolvePaymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  const remainingAmount = roundMoney(totalAmount - paidAmount);

  if (remainingAmount <= 0 && totalAmount > 0) {
    return "SOLDE";
  }

  if (paidAmount > 0) {
    return "RESERVE_ACOMPTE_REQUIS";
  }

  return "DEVIS_PROFORMA";
}

export function getPaymentStatusPreviewLabel(totalAmount: number, paidAmount: number): string {
  const status = resolvePaymentStatus(totalAmount, paidAmount);
  return getPaymentStatusLabel(status);
}

export function getPaymentStatusPreviewHint(totalAmount: number, paidAmount: number): string {
  const remainingAmount = roundMoney(Math.max(totalAmount - paidAmount, 0));

  if (totalAmount <= 0) {
    return "Saisissez un montant total pour prévisualiser le statut.";
  }

  if (remainingAmount <= 0) {
    return "Acompte égal ou supérieur au total : le revenu sera soldé.";
  }

  if (paidAmount > 0) {
    return `Reste à payer : ${remainingAmount.toFixed(2)} — statut « Réservé — acompte requis ».`;
  }

  return "Aucun acompte : le revenu restera en devis / pro-forma.";
}

export type RevenueStatusBadge = {
  key: string;
  label: string;
  tone: "financial" | "operational" | "terminal";
  financialStatus?: PaymentStatus | string;
};

export function getRevenueStatusBadges(
  financialStatus: PaymentStatus | string,
  fulfillment?: RevenueFulfillmentMetadata | null
): RevenueStatusBadge[] {
  if (financialStatus === "LITIGE_ANNULE") {
    return [{ key: "litige", label: getPaymentStatusLabel("LITIGE_ANNULE"), tone: "terminal" }];
  }

  const badges: RevenueStatusBadge[] = [
    {
      key: "financial",
      label: getPaymentStatusLabel(financialStatus),
      tone: "financial",
      financialStatus,
    },
  ];

  if (fulfillment?.fulfillmentStatus === "REALIZED") {
    badges.push({
      key: "realized",
      label: "Session réalisée",
      tone: "operational",
    });
  }

  return badges;
}

export function revenueStatusBadgeClassName(badge: Pick<RevenueStatusBadge, "tone" | "financialStatus">): string {
  if (badge.tone === "terminal") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (badge.tone === "operational") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }

  if (badge.financialStatus === "SOLDE") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

export function canRecordRevenuePayment(
  financialStatus: PaymentStatus | string,
  remainingAmount: number
): boolean {
  return financialStatus !== "LITIGE_ANNULE" && financialStatus !== "SOLDE" && remainingAmount > 0;
}

export function canMarkRevenueRealized(
  financialStatus: PaymentStatus | string,
  fulfillment?: RevenueFulfillmentMetadata | null
): boolean {
  return financialStatus !== "LITIGE_ANNULE" && fulfillment?.fulfillmentStatus !== "REALIZED";
}

export function canCancelRevenue(
  financialStatus: PaymentStatus | string,
  fulfillment?: RevenueFulfillmentMetadata | null,
  revenueCategory?: RevenueCategory | string | null
): boolean {
  if (financialStatus === "LITIGE_ANNULE") {
    return false;
  }

  if (financialStatus !== "SOLDE") {
    return true;
  }

  if (isBookableRevenueCategory(revenueCategory)) {
    return fulfillment?.fulfillmentStatus !== "REALIZED";
  }

  return false;
}
