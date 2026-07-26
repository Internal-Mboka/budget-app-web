import type { CurrencyType, ExpenseCategory, PaymentMethod } from "@prisma/client";
import { parseMoneyInput } from "@/lib/transactions/decimal";

const expenseCategorySchema = z.enum([
  "MATERIEL_EQUIPEMENT",
  "LOYER_CHARGES_FIXES",
  "PAIES_CACHETS_STAFF",
  "INVESTISSEMENT",
]);

const currencySchema = z.enum(["USD", "CDF"]);
const paymentMethodSchema = z.enum(["CASH", "MOBILE_MONEY", "VIREMENT_BANCAIRE", "AUTRE"]);

const moneySchema = z
  .unknown()
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value), { message: "Montant invalide." });

export const createExpenseFormSchema = z.object({
  expenseCategory: expenseCategorySchema,
  totalAmount: moneySchema.refine((value) => value > 0, { message: "Montant invalide." }),
  currency: currencySchema.default("USD"),
  paymentMethod: paymentMethodSchema,
  label: z.string().trim().min(1, "Libellé requis."),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateExpenseFormInput = z.infer<typeof createExpenseFormSchema>;

export function parseCreateExpenseFormData(formData: FormData) {
  const expenseCategory = String(formData.get("expenseCategory") ?? "") as ExpenseCategory;
  const metadata = buildExpenseMetadataFromFormData(formData, expenseCategory);

  const base = createExpenseFormSchema.parse({
    expenseCategory,
    totalAmount: formData.get("totalAmount"),
    currency: formData.get("currency") || "USD",
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    label: metadata.label,
    notes: metadata.notes,
  });

  return {
    ...base,
    metadata,
  };
}

export type ParsedCreateExpenseInput = ReturnType<typeof parseCreateExpenseFormData>;

export type CreateExpensePayload = ParsedCreateExpenseInput & {
  currency: CurrencyType;
  paymentMethod: PaymentMethod;
};
