import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { CashClosingPdfDocument } from "@/lib/cash-closing/pdf/cash-closing-document";
import type { CashClosingPdfData, CashClosingPdfFormat } from "@/lib/cash-closing/pdf/types";

export async function renderCashClosingPdf(
  data: CashClosingPdfData,
  format: CashClosingPdfFormat = "thermal"
): Promise<Buffer> {
  const element = React.createElement(CashClosingPdfDocument, { data, pageFormat: format });
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
