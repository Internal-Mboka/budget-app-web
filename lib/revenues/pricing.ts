import { roundMoney } from "@/lib/transactions/decimal";

export type DiscountType = "NONE" | "PERCENT" | "FIXED";

export type RevenuePricingMetadata = {
  baseAmount: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
};

export function computeDiscountAmount(
  baseAmount: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (discountType === "NONE" || discountValue <= 0 || baseAmount <= 0) {
    return 0;
  }

  if (discountType === "PERCENT") {
    return roundMoney(Math.min(baseAmount, (baseAmount * discountValue) / 100));
  }

  return roundMoney(Math.min(baseAmount, discountValue));
}

export function computeFinalAmount(
  baseAmount: number,
  discountType: DiscountType,
  discountValue: number
): { discountAmount: number; finalAmount: number } {
  const discountAmount = computeDiscountAmount(baseAmount, discountType, discountValue);
  return {
    discountAmount,
    finalAmount: roundMoney(Math.max(baseAmount - discountAmount, 0)),
  };
}

export function buildRevenuePricingMetadata(input: {
  baseAmount: number;
  discountType: DiscountType;
  discountValue: number;
}): RevenuePricingMetadata {
  const { discountAmount, finalAmount } = computeFinalAmount(
    input.baseAmount,
    input.discountType,
    input.discountValue
  );

  return {
    baseAmount: roundMoney(input.baseAmount),
    discountType: input.discountType,
    discountValue: roundMoney(input.discountValue),
    discountAmount,
    finalAmount,
  };
}

export function parseRevenuePricing(metadata: unknown): RevenuePricingMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const pricing = record.pricing;

  if (!pricing || typeof pricing !== "object") {
    return null;
  }

  const data = pricing as Record<string, unknown>;
  const discountType = data.discountType;

  if (discountType !== "NONE" && discountType !== "PERCENT" && discountType !== "FIXED") {
    return null;
  }

  return {
    baseAmount: Number(data.baseAmount ?? 0),
    discountType,
    discountValue: Number(data.discountValue ?? 0),
    discountAmount: Number(data.discountAmount ?? 0),
    finalAmount: Number(data.finalAmount ?? 0),
  };
}
