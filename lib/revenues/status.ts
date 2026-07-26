import type { PaymentStatus } from "@prisma/client";

import { roundMoney } from "@/lib/transactions/decimal";
import { getPaymentStatusLabel } from "@/lib/transactions/labels";

export function resolvePaymentStatus(
  totalAmount: number,
  paidAmount: number
): PaymentStatus {
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
    return "Acompte égal ou supérieur au total : la transaction sera soldée.";
  }

  if (paidAmount > 0) {
    return `Reste à payer : ${remainingAmount.toFixed(2)} — statut « Réservé — acompte requis ».`;
  }

  return "Aucun acompte : la transaction restera en devis / pro-forma.";
}
