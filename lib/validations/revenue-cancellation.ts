import { z } from "zod";

import type { CancellationPenaltyMode } from "@/lib/revenues/cancellation";
import { parseMoneyInput } from "@/lib/transactions/decimal";

const penaltyModeSchema = z.enum(["REFUND_ALL", "KEEP_DEPOSIT", "CUSTOM"]);

const moneySchema = z
  .unknown()
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value), { message: "Montant invalide." });

export const cancelRevenueSchema = z.object({
  transactionId: z.string().trim().min(1, "Revenu introuvable."),
  reason: z.string().trim().min(3, "Le motif doit contenir au moins 3 caractères.").max(2000),
  penaltyMode: penaltyModeSchema,
  customPenaltyAmount: moneySchema.optional(),
});

export type CancelRevenueInput = z.infer<typeof cancelRevenueSchema> & {
  penaltyMode: CancellationPenaltyMode;
};

export function parseCancelRevenueFormData(formData: FormData): CancelRevenueInput {
  const penaltyMode = String(formData.get("penaltyMode") ?? "REFUND_ALL") as CancellationPenaltyMode;
  const rawCustomPenalty = formData.get("customPenaltyAmount");

  return cancelRevenueSchema.parse({
    transactionId: String(formData.get("transactionId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    penaltyMode,
    customPenaltyAmount:
      penaltyMode === "CUSTOM" && rawCustomPenalty != null && String(rawCustomPenalty).trim() !== ""
        ? rawCustomPenalty
        : undefined,
  });
}
