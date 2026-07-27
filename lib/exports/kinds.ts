import type { GeneratedExportKind } from "@prisma/client";

export const GENERATED_EXPORT_KINDS: GeneratedExportKind[] = [
  "FINANCIAL_CSV",
  "EXPENSE_RECAP_PDF",
  "PERIOD_BALANCE_PDF",
  "FISCAL_PERIOD_BALANCE_PDF",
];

export function getGeneratedExportKindLabel(kind: GeneratedExportKind): string {
  switch (kind) {
    case "FINANCIAL_CSV":
      return "Registre comptable";
    case "EXPENSE_RECAP_PDF":
      return "Récapitulatif des dépenses";
    case "PERIOD_BALANCE_PDF":
      return "Bilan mensuel";
    case "FISCAL_PERIOD_BALANCE_PDF":
      return "Bilan trimestriel";
    default:
      return kind;
  }
}

export function getGeneratedExportFormatLabel(mimeType: string): string {
  if (mimeType.includes("pdf")) {
    return "PDF";
  }

  if (mimeType.includes("csv")) {
    return "CSV";
  }

  return mimeType;
}
