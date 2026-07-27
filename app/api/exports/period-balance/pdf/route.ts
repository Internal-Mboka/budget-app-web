import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { hasAnyPermission } from "@/lib/auth/session";
import { loadPeriodBalancePdfData } from "@/lib/period-closure/close-period";
import { getPeriodBalancePdfFilename } from "@/lib/period-closure/load-period-balance";
import { renderPeriodBalancePdf } from "@/lib/period-closure/pdf/render-period-balance-pdf";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
    ])
  ) {
    return NextResponse.json({ error: "Bilan réservé au PDG et au Comptable." }, { status: 403 });
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
