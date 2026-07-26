import type { RevenueCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import { getRevenueMetadataSummary, type RevenueMetadata } from "@/lib/revenues/metadata";
import type { RevenuePdfData, RevenuePdfDocumentType } from "@/lib/revenues/pdf/types";
import { parseRevenuePricing } from "@/lib/revenues/pricing";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { getPaymentStatusLabel } from "@/lib/transactions/labels";

export async function loadRevenuePdfData(
  transactionId: string,
  documentType: RevenuePdfDocumentType
): Promise<RevenuePdfData | null> {
  const revenue = await prisma.transaction.findFirst({
    where: { id: transactionId, type: "REVENUE" },
    select: {
      id: true,
      code: true,
      revenueCategory: true,
      totalAmount: true,
      paidAmount: true,
      remainingAmount: true,
      currency: true,
      status: true,
      paymentMethod: true,
      metadata: true,
      createdAt: true,
      client: { select: { name: true } },
    },
  });

  if (!revenue || !revenue.revenueCategory) {
    return null;
  }

  if (documentType === "receipt" && decimalToNumber(revenue.paidAmount) <= 0) {
    return null;
  }

  const category = revenue.revenueCategory as RevenueCategory;
  const pricing = parseRevenuePricing(revenue.metadata);

  return {
    id: revenue.id,
    code: revenue.code,
    documentType,
    revenueCategory: category,
    revenueCategoryLabel: getRevenueCategoryLabel(category),
    serviceSummary: getRevenueMetadataSummary(category, revenue.metadata as RevenueMetadata | null),
    status: revenue.status,
    statusLabel: getPaymentStatusLabel(revenue.status),
    totalAmount: decimalToNumber(revenue.totalAmount),
    paidAmount: decimalToNumber(revenue.paidAmount),
    remainingAmount: decimalToNumber(revenue.remainingAmount),
    currency: revenue.currency,
    paymentMethodLabel: getPaymentMethodLabel(revenue.paymentMethod),
    clientName: revenue.client?.name ?? "Client non renseigné",
    issuedAt: revenue.createdAt.toISOString(),
    isCancelled: revenue.status === "LITIGE_ANNULE",
    pricing: pricing && pricing.discountType !== "NONE" ? pricing : null,
  };
}
