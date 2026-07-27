import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { hasAnyPermission } from "@/lib/auth/session";
import {
  getExpenseRecapPdfFilename,
  loadExpenseRecapPdfData,
} from "@/lib/exports/expense-recap/load-expense-recap-pdf-data";
import { renderExpenseRecapPdf } from "@/lib/exports/expense-recap/render-expense-recap-pdf";
import { parseFinancialExportFilters } from "@/lib/exports/filters";
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
    return NextResponse.json({ error: "Export réservé au PDG et au Comptable." }, { status: 403 });
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
