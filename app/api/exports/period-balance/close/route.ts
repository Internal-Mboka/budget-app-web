import { NextResponse } from "next/server";

import { closeFinancialPeriodAction } from "@/lib/period-closure/close-period";

export async function POST(request: Request) {
  const formData = await request.formData();
  const from = String(formData.get("from") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();

  const result = await closeFinancialPeriodAction({ from, to });

  if (!result.success) {
    const redirectUrl = new URL("/exports", request.url);
    redirectUrl.searchParams.set("from", from);
    redirectUrl.searchParams.set("to", to);
    redirectUrl.searchParams.set("closureError", encodeURIComponent(result.error));
    return NextResponse.redirect(redirectUrl, 303);
  }

  const pdfUrl = new URL("/api/exports/period-balance/pdf", request.url);
  pdfUrl.searchParams.set("from", from);
  pdfUrl.searchParams.set("to", to);

  return NextResponse.redirect(pdfUrl, 303);
}
