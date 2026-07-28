import type { PaymentMethod } from "@prisma/client";

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Espèces" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "VIREMENT_BANCAIRE", label: "Virement bancaire" },
  { value: "AUTRE", label: "Autre" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  VIREMENT_BANCAIRE: "Virement bancaire",
  AUTRE: "Autre",
};

export function getPaymentMethodLabel(method: PaymentMethod | string | null | undefined): string {
  if (!method) {
    return "—";
  }

  return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method;
}
