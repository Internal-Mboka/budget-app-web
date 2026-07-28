import { NextResponse } from "next/server";

import { assertFinancialExportSession } from "@/lib/exports/access";
import { persistGeneratedExport } from "@/lib/exports/persist-generated-export";
import { loadFiscalPeriodBalancePdfData } from "@/lib/period-closure/close-period";
import { getPeriodBalancePdfFilename } from "@/lib/period-closure/load-period-balance";
import { renderPeriodBalancePdf } from "@/lib/period-closure/pdf/render-period-balance-pdf";

export async function GET(request: Request) {
  const auth = await assertFinancialExportSession();

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const periodId = url.searchParams.get("periodId")?.trim();

  if (!periodId) {
    return NextResponse.json({ error: "Identifiant de trimestre requis." }, { status: 400 });
  }

  const data = await loadFiscalPeriodBalancePdfData(periodId);

  if (!data) {
    return NextResponse.json(
      { error: "Aucun bilan trimestriel archivé pour ce trimestre." },
      { status: 404 }
    );
  }

  try {
    const pdfBuffer = await renderPeriodBalancePdf(data);
    const filename = getPeriodBalancePdfFilename(data.documentCode, false);
    const bytes = Buffer.from(pdfBuffer);

    void persistGeneratedExport({
      kind: "FISCAL_PERIOD_BALANCE_PDF",
      fileName: filename,
      mimeType: "application/pdf",
      bytes,
      context: { periodId },
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
    console.error("fiscal period balance pdf generation failed", error);
    return NextResponse.json({ error: "Impossible de générer le bilan PDF." }, { status: 500 });
  }
}
