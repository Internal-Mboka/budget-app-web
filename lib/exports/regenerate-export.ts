import type { GeneratedExportKind } from "@prisma/client";

import {
  parseFinancialExportFilters,
  parseFinancialExportRegister,
  type FinancialExportRegister,
} from "@/lib/exports/filters";
import {
  buildFinancialExportCsv,
  getFinancialExportFilename,
} from "@/lib/exports/load-financial-register";
import {
  getExpenseRecapPdfFilename,
  loadExpenseRecapPdfData,
} from "@/lib/exports/expense-recap/load-expense-recap-pdf-data";
import { renderExpenseRecapPdf } from "@/lib/exports/expense-recap/render-expense-recap-pdf";
import {
  loadFiscalPeriodBalancePdfData,
  loadPeriodBalancePdfData,
} from "@/lib/period-closure/close-period";
import { getPeriodBalancePdfFilename } from "@/lib/period-closure/load-period-balance";
import { renderPeriodBalancePdf } from "@/lib/period-closure/pdf/render-period-balance-pdf";

export type RegeneratedExport = {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function regenerateExportFile(input: {
  kind: GeneratedExportKind;
  context: unknown;
}): Promise<RegeneratedExport | null> {
  const context = asRecord(input.context);

  switch (input.kind) {
    case "FINANCIAL_CSV": {
      const register = parseFinancialExportRegister(String(context.register ?? "journal"));
      const filters = parseFinancialExportFilters({
        from: String(context.from ?? ""),
        to: String(context.to ?? ""),
        register: register as FinancialExportRegister,
      });
      const csv = await buildFinancialExportCsv(filters, register);
      return {
        bytes: Buffer.from(csv, "utf-8"),
        fileName: getFinancialExportFilename(register, filters),
        mimeType: "text/csv; charset=utf-8",
      };
    }
    case "EXPENSE_RECAP_PDF": {
      const filters = parseFinancialExportFilters({
        from: String(context.from ?? ""),
        to: String(context.to ?? ""),
      });
      const data = await loadExpenseRecapPdfData(filters);

      if (!data) {
        return null;
      }

      const pdfBuffer = await renderExpenseRecapPdf(data);
      return {
        bytes: Buffer.from(pdfBuffer),
        fileName: getExpenseRecapPdfFilename(filters.from, filters.to),
        mimeType: "application/pdf",
      };
    }
    case "PERIOD_BALANCE_PDF": {
      const from = String(context.from ?? "");
      const to = String(context.to ?? "");
      const preview = context.preview === true;
      const data = await loadPeriodBalancePdfData({ from, to, preview });

      if (!data) {
        return null;
      }

      const pdfBuffer = await renderPeriodBalancePdf(data);
      return {
        bytes: Buffer.from(pdfBuffer),
        fileName: getPeriodBalancePdfFilename(data.documentCode, data.isPreview),
        mimeType: "application/pdf",
      };
    }
    case "FISCAL_PERIOD_BALANCE_PDF": {
      const periodId = String(context.periodId ?? "").trim();
      const data = await loadFiscalPeriodBalancePdfData(periodId);

      if (!data) {
        return null;
      }

      const pdfBuffer = await renderPeriodBalancePdf(data);
      return {
        bytes: Buffer.from(pdfBuffer),
        fileName: getPeriodBalancePdfFilename(data.documentCode, false),
        mimeType: "application/pdf",
      };
    }
    default:
      return null;
  }
}
