import type { CurrencyType, PaymentStatus, RevenueCategory } from "@prisma/client";

export type RevenuePdfDocumentType = "proforma" | "receipt";

export type RevenuePdfData = {
  id: string;
  code: string;
  documentType: RevenuePdfDocumentType;
  revenueCategory: RevenueCategory;
  revenueCategoryLabel: string;
  serviceSummary: string;
  status: PaymentStatus;
  statusLabel: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: CurrencyType;
  paymentMethodLabel: string;
  clientName: string;
  issuedAt: string;
  isCancelled: boolean;
  pricing?: {
    baseAmount: number;
    discountType: "NONE" | "PERCENT" | "FIXED";
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
  } | null;
};

export const MBOKA_PDF_BRAND = {
  name: "Mboka Studio",
  product: "Mboka Budget",
  color: "#10579F",
  accent: "#EFF8FF",
} as const;

export function getRevenuePdfFilename(code: string, documentType: RevenuePdfDocumentType): string {
  const suffix = documentType === "proforma" ? "proforma" : "recu";
  return `${code}-${suffix}.pdf`;
}

export function getRevenuePdfTitle(documentType: RevenuePdfDocumentType): string {
  return documentType === "proforma" ? "Devis / Pro-forma" : "Reçu d'encaissement";
}
