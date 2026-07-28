import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { RevenuePdfDocument } from "@/lib/revenues/pdf/revenue-document";
import type { RevenuePdfData } from "@/lib/revenues/pdf/types";

export async function renderRevenuePdf(data: RevenuePdfData): Promise<Buffer> {
  const element = React.createElement(RevenuePdfDocument, { data });
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
