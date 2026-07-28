import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { PeriodBalancePdfDocument } from "@/lib/period-closure/pdf/period-balance-document";
import type { PeriodBalancePdfData } from "@/lib/period-closure/pdf/types";

export async function renderPeriodBalancePdf(data: PeriodBalancePdfData): Promise<Buffer> {
  const element = React.createElement(PeriodBalancePdfDocument, { data });
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
