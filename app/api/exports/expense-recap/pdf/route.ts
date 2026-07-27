import { NextResponse } from "next/server";

import { assertFinancialExportSession } from "@/lib/exports/access";
import {
  getExpenseRecapPdfFilename,
  loadExpenseRecapPdfData,
} from "@/lib/exports/expense-recap/load-expense-recap-pdf-data";
import { renderExpenseRecapPdf } from "@/lib/exports/expense-recap/render-expense-recap-pdf";
import { parseFinancialExportFilters } from "@/lib/exports/filters";
import { persistGeneratedExport } from "@/lib/exports/persist-generated-export";

export async function GET(request: Request) {
  const auth = await assertFinancialExportSession();

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const filters = parseFinancialExportFilters({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  const data = await loadExpenseRecapPdfData(filters);

  if (!data) {
    return NextResponse.json(
      { error: "Aucune dépense sur cette période pour générer le récapitulatif." },
      { status: 404 }
    );
  }

  try {
    const pdfBuffer = await renderExpenseRecapPdf(data);
    const filename = getExpenseRecapPdfFilename(filters.from, filters.to);
    const bytes = Buffer.from(pdfBuffer);

    void persistGeneratedExport({
      kind: "EXPENSE_RECAP_PDF",
      fileName: filename,
      mimeType: "application/pdf",
      bytes,
      context: { from: filters.from, to: filters.to },
      userId: auth.session.user.id,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("expense recap pdf generation failed", error);
    return NextResponse.json({ error: "Impossible de générer le récapitulatif PDF." }, { status: 500 });
  }
}
