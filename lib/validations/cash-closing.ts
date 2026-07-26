import { z } from "zod";

import { parseClosingDateInput } from "@/lib/cash-closing/day-range";
import { parseMoneyInput } from "@/lib/transactions/decimal";

const moneySchema = z
  .unknown()
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value) && value >= 0, { message: "Montant invalide." });

const closingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de clôture invalide.")
  .transform((value) => parseClosingDateInput(value));

export const createCashClosingSchema = z.object({
  closingDate: closingDateSchema,
  realCash: moneySchema,
  realMobileMoney: moneySchema,
});

export type CreateCashClosingInput = z.infer<typeof createCashClosingSchema>;

export function parseCreateCashClosingFormData(formData: FormData) {
  return createCashClosingSchema.parse({
    closingDate: String(formData.get("closingDate") ?? ""),
    realCash: formData.get("realCash"),
    realMobileMoney: formData.get("realMobileMoney"),
  });
}
