import type { PaymentMethod } from "@prisma/client";
import { z } from "zod";

import { parseMoneyInput } from "@/lib/transactions/decimal";

const moneySchema = z
  .unknown()
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value), { message: "Montant invalide." });

const paymentMethodSchema = z.enum(["CASH", "MOBILE_MONEY", "VIREMENT_BANCAIRE", "AUTRE"]);

export const recordRevenuePaymentSchema = z.object({
  transactionId: z.string().trim().min(1, "Transaction invalide."),
  paymentAmount: moneySchema.refine((value) => value > 0, {
    message: "Le montant du paiement doit être supérieur à 0.",
  }),
  paymentMethod: paymentMethodSchema.optional(),
});

export type RecordRevenuePaymentInput = z.infer<typeof recordRevenuePaymentSchema> & {
  paymentMethod?: PaymentMethod;
};

export function parseRecordRevenuePaymentFormData(formData: FormData): RecordRevenuePaymentInput {
  const rawPaymentMethod = String(formData.get("paymentMethod") ?? "");

  return recordRevenuePaymentSchema.parse({
    transactionId: String(formData.get("transactionId") ?? ""),
    paymentAmount: formData.get("paymentAmount"),
    paymentMethod: rawPaymentMethod || undefined,
  });
}

export const markRevenueRealizedSchema = z.object({
  transactionId: z.string().trim().min(1, "Transaction invalide."),
});

export function parseMarkRevenueRealizedFormData(formData: FormData) {
  return markRevenueRealizedSchema.parse({
    transactionId: String(formData.get("transactionId") ?? ""),
  });
}
