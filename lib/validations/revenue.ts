import type { CurrencyType, PaymentMethod, RevenueCategory } from "@prisma/client";
import { z } from "zod";

import { buildMetadataFromFormData, parseRevenueMetadata } from "@/lib/revenues/metadata";
import { parseMoneyInput } from "@/lib/transactions/decimal";

const revenueCategorySchema = z.enum([
  "STUDIO_SESSION",
  "SERVICES_MIX_MASTER",
  "LOCATION_VEHICULE",
  "VENTE_ANNEXE",
]);

const currencySchema = z.enum(["USD", "CDF"]);
const paymentMethodSchema = z.enum(["CASH", "MOBILE_MONEY", "VIREMENT_BANCAIRE", "AUTRE"]);

const moneySchema = z
  .unknown()
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value), { message: "Montant invalide." });

export const createRevenueFormSchema = z.object({
  revenueCategory: revenueCategorySchema,
  clientId: z.string().trim().min(1, "Veuillez sélectionner un client."),
  totalAmount: moneySchema.refine((value) => value > 0, { message: "Montant total invalide." }),
  paidAmount: moneySchema.refine((value) => value >= 0, { message: "Acompte invalide." }),
  currency: currencySchema.default("USD"),
  paymentMethod: paymentMethodSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateRevenueFormInput = z.infer<typeof createRevenueFormSchema>;

export function parseCreateRevenueFormData(formData: FormData) {
  const revenueCategory = String(formData.get("revenueCategory") ?? "") as RevenueCategory;
  const rawPaymentMethod = String(formData.get("paymentMethod") ?? "");

  const base = createRevenueFormSchema.parse({
    revenueCategory,
    clientId: String(formData.get("clientId") ?? ""),
    totalAmount: formData.get("totalAmount"),
    paidAmount: formData.get("paidAmount") ?? 0,
    currency: formData.get("currency") || "USD",
    paymentMethod: rawPaymentMethod || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  const metadataRaw = buildMetadataFromFormData(formData, revenueCategory);
  const metadata = parseRevenueMetadata(revenueCategory, metadataRaw);

  if (base.paidAmount > base.totalAmount) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "L'acompte ne peut pas dépasser le montant total.",
        path: ["paidAmount"],
      },
    ]);
  }

  return {
    ...base,
    metadata,
  };
}

export type ParsedCreateRevenueInput = ReturnType<typeof parseCreateRevenueFormData>;

export type CreateRevenuePayload = ParsedCreateRevenueInput & {
  currency: CurrencyType;
  paymentMethod?: PaymentMethod;
};
