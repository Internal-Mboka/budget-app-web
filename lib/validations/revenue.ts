import type { CurrencyType, PaymentMethod, RevenueCategory } from "@prisma/client";
import { z } from "zod";

import { buildMetadataFromFormData, parseRevenueMetadata } from "@/lib/revenues/metadata";
import {
  buildRevenuePricingMetadata,
  computeFinalAmount,
  type DiscountType,
} from "@/lib/revenues/pricing";
import { parseMoneyInput, roundMoney } from "@/lib/transactions/decimal";

const revenueCategorySchema = z.enum([
  "STUDIO_SESSION",
  "SERVICES_MIX_MASTER",
  "LOCATION_VEHICULE",
  "VENTE_ANNEXE",
]);

const currencySchema = z.enum(["USD", "CDF"]);
const paymentMethodSchema = z.enum(["CASH", "MOBILE_MONEY", "VIREMENT_BANCAIRE", "AUTRE"]);
const discountTypeSchema = z.enum(["NONE", "PERCENT", "FIXED"]);

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
  baseAmount: moneySchema.optional(),
  discountType: discountTypeSchema.default("NONE"),
  discountValue: moneySchema.optional(),
});

export type CreateRevenueFormInput = z.infer<typeof createRevenueFormSchema>;

export function parseCreateRevenueFormData(formData: FormData, options?: { allowDiscount?: boolean }) {
  const revenueCategory = String(formData.get("revenueCategory") ?? "") as RevenueCategory;
  const rawPaymentMethod = String(formData.get("paymentMethod") ?? "");
  const discountType = (String(formData.get("discountType") ?? "NONE") || "NONE") as DiscountType;
  const rawBaseAmount = formData.get("baseAmount");
  const rawDiscountValue = formData.get("discountValue");

  const base = createRevenueFormSchema.parse({
    revenueCategory,
    clientId: String(formData.get("clientId") ?? ""),
    totalAmount: formData.get("totalAmount"),
    paidAmount: formData.get("paidAmount") ?? 0,
    currency: formData.get("currency") || "USD",
    paymentMethod: rawPaymentMethod || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
    baseAmount: rawBaseAmount != null && String(rawBaseAmount).trim() !== "" ? rawBaseAmount : undefined,
    discountType: options?.allowDiscount ? discountType : "NONE",
    discountValue:
      options?.allowDiscount && rawDiscountValue != null && String(rawDiscountValue).trim() !== ""
        ? rawDiscountValue
        : undefined,
  });

  const metadataRaw = buildMetadataFromFormData(formData, revenueCategory);
  let metadata = parseRevenueMetadata(revenueCategory, metadataRaw) as Record<string, unknown>;

  let totalAmount = base.totalAmount;

  if (options?.allowDiscount && base.discountType !== "NONE") {
    const pricingBase = base.baseAmount && base.baseAmount > 0 ? base.baseAmount : base.totalAmount;
    const discountValue = base.discountValue ?? 0;

    if (discountValue <= 0) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "Indiquez une valeur de remise valide.",
          path: ["discountValue"],
        },
      ]);
    }

    if (base.discountType === "PERCENT" && discountValue > 100) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "La remise ne peut pas dépasser 100 %.",
          path: ["discountValue"],
        },
      ]);
    }

    const pricing = buildRevenuePricingMetadata({
      baseAmount: pricingBase,
      discountType: base.discountType,
      discountValue,
    });

    if (roundMoney(pricing.finalAmount) !== roundMoney(totalAmount)) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "Le montant total ne correspond pas au prix après remise.",
          path: ["totalAmount"],
        },
      ]);
    }

    totalAmount = pricing.finalAmount;
    metadata = { ...metadata, pricing };
  }

  if (base.paidAmount > totalAmount) {
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
    totalAmount,
    metadata,
  };
}

export type ParsedCreateRevenueInput = ReturnType<typeof parseCreateRevenueFormData>;

export type CreateRevenuePayload = ParsedCreateRevenueInput & {
  currency: CurrencyType;
  paymentMethod?: PaymentMethod;
};

export function previewDiscountedTotal(
  baseAmount: number,
  discountType: DiscountType,
  discountValue: number
): number {
  return computeFinalAmount(baseAmount, discountType, discountValue).finalAmount;
}
