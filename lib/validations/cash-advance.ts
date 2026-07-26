import type { CurrencyType, PaymentMethod } from "@prisma/client";
import { z } from "zod";

import { buildCashAdvanceMetadata } from "@/lib/expenses/cash-advance";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { parseMoneyInput } from "@/lib/transactions/decimal";

const currencySchema = z.enum(["USD", "CDF"]);
const paymentMethodSchema = z.enum(["CASH", "MOBILE_MONEY", "VIREMENT_BANCAIRE", "AUTRE"]);

const moneySchema = z
  .unknown()
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value), { message: "Montant invalide." });

export const createCashAdvanceRequestSchema = z.object({
  purpose: z.string().trim().min(1, "Motif requis."),
  totalAmount: moneySchema.refine((value) => value > 0, { message: "Montant invalide." }),
  currency: currencySchema.default("USD"),
  paymentMethod: paymentMethodSchema,
  notes: z.string().trim().max(2000).optional(),
});

export type CreateCashAdvanceRequestInput = z.infer<typeof createCashAdvanceRequestSchema>;

export function parseCreateCashAdvanceRequestFormData(formData: FormData) {
  const parsed = createCashAdvanceRequestSchema.parse({
    purpose: String(formData.get("purpose") ?? ""),
    totalAmount: formData.get("totalAmount"),
    currency: formData.get("currency") || "USD",
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  const metadata: ExpenseMetadata & { cashAdvance: ReturnType<typeof buildCashAdvanceMetadata> } = {
    label: parsed.purpose,
    notes: parsed.notes,
    cashAdvance: buildCashAdvanceMetadata(parsed.purpose, "SUBMITTED"),
  };

  return {
    ...parsed,
    metadata,
  };
}

export type ParsedCashAdvanceRequestInput = ReturnType<typeof parseCreateCashAdvanceRequestFormData>;

export type CreateCashAdvanceRequestPayload = ParsedCashAdvanceRequestInput & {
  currency: CurrencyType;
  paymentMethod: PaymentMethod;
};
