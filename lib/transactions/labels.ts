import type { PaymentStatus } from "@prisma/client";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  DEVIS_PROFORMA: "Devis / Pro-forma",
  RESERVE_ACOMPTE_REQUIS: "Réservé — acompte requis",
  EN_COURS_REALISE: "En cours / réalisé",
  SOLDE: "Soldé",
  LITIGE_ANNULE: "Litige / annulé",
};

export const PAYMENT_STATUS_FILTER_OPTIONS: Array<{ value: "ALL" | PaymentStatus; label: string }> =
  [
    { value: "ALL", label: "Tous les statuts" },
    { value: "DEVIS_PROFORMA", label: PAYMENT_STATUS_LABELS.DEVIS_PROFORMA },
    { value: "RESERVE_ACOMPTE_REQUIS", label: PAYMENT_STATUS_LABELS.RESERVE_ACOMPTE_REQUIS },
    { value: "EN_COURS_REALISE", label: PAYMENT_STATUS_LABELS.EN_COURS_REALISE },
    { value: "SOLDE", label: PAYMENT_STATUS_LABELS.SOLDE },
    { value: "LITIGE_ANNULE", label: PAYMENT_STATUS_LABELS.LITIGE_ANNULE },
  ];

export function getPaymentStatusLabel(status: PaymentStatus | string): string {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status;
}
