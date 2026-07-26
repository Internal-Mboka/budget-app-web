import { z } from "zod";

import { parseMoneyInput } from "@/lib/transactions/decimal";

const adjustmentModeSchema = z.enum(["PARTIAL", "FULL"]);

const moneySchema = z
  .unknown()
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value), { message: "Montant invalide." });

export const createTransactionAdjustmentFormSchema = z.object({
  transactionId: z.string().trim().min(1, "Transaction introuvable."),
  mode: adjustmentModeSchema,
  amount: moneySchema.optional(),
  reason: z.string().trim().min(3, "Indiquez un motif d'au moins 3 caractères."),
});

export function parseCreateTransactionAdjustmentFormData(formData: FormData) {
  const mode = String(formData.get("mode") ?? "PARTIAL") as "PARTIAL" | "FULL";
  const rawAmount = formData.get("amount");

  return createTransactionAdjustmentFormSchema.parse({
    transactionId: String(formData.get("transactionId") ?? ""),
    mode,
    amount: mode === "PARTIAL" && rawAmount != null && String(rawAmount).trim() !== "" ? rawAmount : undefined,
    reason: String(formData.get("reason") ?? ""),
  });
}

export type ParsedCreateTransactionAdjustmentInput = ReturnType<
  typeof parseCreateTransactionAdjustmentFormData
>;
