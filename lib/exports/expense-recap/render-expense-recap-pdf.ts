import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { ExpenseRecapPdfDocument } from "@/lib/exports/expense-recap/expense-recap-document";
import type { ExpenseRecapPdfData } from "@/lib/exports/expense-recap/types";

export async function renderExpenseRecapPdf(data: ExpenseRecapPdfData): Promise<Buffer> {
  const element = React.createElement(ExpenseRecapPdfDocument, { data });
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
