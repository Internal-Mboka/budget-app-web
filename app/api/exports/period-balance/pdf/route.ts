import { NextResponse } from "next/server";

import { assertFinancialExportSession } from "@/lib/exports/access";
import { persistGeneratedExport } from "@/lib/exports/persist-generated-export";
import { loadPeriodBalancePdfData } from "@/lib/period-closure/close-period";
import { getPeriodBalancePdfFilename } from "@/lib/period-closure/load-period-balance";
import { renderPeriodBalancePdf } from "@/lib/period-closure/pdf/render-period-balance-pdf";

export async function GET(request: Request) {
  const auth = await assertFinancialExportSession();

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const preview = url.searchParams.get("preview") === "1";

  const data = await loadPeriodBalancePdfData({ from: from ?? "", to: to ?? "", preview });

  if (!data) {
    return NextResponse.json(
      {
        error: preview
          ? "Période invalide pour l'aperçu (mois civil complet requis)."
          : "Ce mois n'est pas clôturé. Utilisez l'aperçu brouillon ou clôturez la période.",
      },
      { status: 404 }
    );
  }

  try {
    const pdfBuffer = await renderPeriodBalancePdf(data);
    const filename = getPeriodBalancePdfFilename(data.documentCode, data.isPreview);
    const bytes = Buffer.from(pdfBuffer);

    void persistGeneratedExport({
      kind: "PERIOD_BALANCE_PDF",
      fileName: filename,
      mimeType: "application/pdf",
      bytes,
      context: { from: from ?? "", to: to ?? "", preview },
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
    console.error("period balance pdf generation failed", error);
    return NextResponse.json({ error: "Impossible de générer le bilan PDF." }, { status: 500 });
  }
}
