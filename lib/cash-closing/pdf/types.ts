export type CashClosingPdfFormat = "thermal" | "a4";

export type CashClosingPdfData = {
  id: string;
  closingDate: string;
  closingDateLabel: string;
  operatorName: string;
  openingCash: number;
  openingMobileMoney: number;
  cashRevenues: number;
  mobileRevenues: number;
  cashExpenses: number;
  mobileExpenses: number;
  expectedCash: number;
  expectedMobileMoney: number;
  realCash: number;
  realMobileMoney: number;
  gapCash: number;
  gapMobileMoney: number;
  gapAmount: number;
  hasDiscrepancy: boolean;
  notes?: string | null;
  issuedAt: string;
};

export const MBOKA_Z_BRAND = {
  name: "Mboka Studio",
  product: "Mboka Budget",
  title: "Z de caisse",
} as const;

export function getCashClosingPdfFilename(closingDate: string): string {
  return `z-caisse-${closingDate}.pdf`;
}
