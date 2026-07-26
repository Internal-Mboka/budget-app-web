import type { CurrencyType, ExpenseCategory, PaymentMethod } from "@prisma/client";
import { z } from "zod";

import { computeInitialNextDueDate } from "@/lib/expenses/recurring";
import { parseMoneyInput } from "@/lib/transactions/decimal";

const expenseCategorySchema = z.enum([
  "MATERIEL_EQUIPEMENT",
  "LOYER_CHARGES_FIXES",
  "INVESTISSEMENT",
]);

const recurringPeriodSchema = z.enum(["MONTHLY", "QUARTERLY"]);
const currencySchema = z.enum(["USD", "CDF"]);
const paymentMethodSchema = z.enum(["CASH", "MOBILE_MONEY", "VIREMENT_BANCAIRE", "AUTRE"]);

const moneySchema = z
  .unknown()
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value), { message: "Montant invalide." });

export const createRecurringExpenseTemplateSchema = z.object({
  expenseCategory: expenseCategorySchema,
  recurringPeriod: recurringPeriodSchema,
  totalAmount: moneySchema.refine((value) => value > 0, { message: "Montant invalide." }),
  currency: currencySchema.default("USD"),
  paymentMethod: paymentMethodSchema,
  label: z.string().trim().min(1, "Libellé requis."),
  notes: z.string().trim().max(2000).optional(),
  dueDayOfMonth: z.coerce.number().int().min(1).max(28),
});

export type CreateRecurringExpenseTemplateInput = z.infer<typeof createRecurringExpenseTemplateSchema>;

export function parseCreateRecurringExpenseTemplateFormData(formData: FormData) {
  const parsed = createRecurringExpenseTemplateSchema.parse({
    expenseCategory: String(formData.get("expenseCategory") ?? ""),
    recurringPeriod: String(formData.get("recurringPeriod") ?? ""),
    totalAmount: formData.get("totalAmount"),
    currency: formData.get("currency") || "USD",
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    label: String(formData.get("label") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
    dueDayOfMonth: formData.get("dueDayOfMonth") ?? "1",
  });

  const nextDueDate = computeInitialNextDueDate(parsed.dueDayOfMonth);

  return {
    ...parsed,
    nextDueDate,
  };
}

export type ParsedRecurringExpenseTemplateInput = ReturnType<typeof parseCreateRecurringExpenseTemplateFormData>;

export type CreateRecurringExpenseTemplatePayload = ParsedRecurringExpenseTemplateInput & {
  currency: CurrencyType;
  paymentMethod: PaymentMethod;
  expenseCategory: ExpenseCategory;
};
