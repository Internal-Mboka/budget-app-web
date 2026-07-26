import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { loadCashClosingPdfData } from "@/lib/cash-closing/pdf/load-cash-closing-pdf-data";
import { renderCashClosingPdf } from "@/lib/cash-closing/pdf/render-cash-closing-pdf";
import { getCashClosingPdfFilename, type CashClosingPdfFormat } from "@/lib/cash-closing/pdf/types";
import { PERMISSIONS } from "@/lib/permissions";

const formatSchema = z.enum(["thermal", "a4"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.CASH_CLOSE)) {
    return NextResponse.json({ error: "Permission insuffisante." }, { status: 403 });
  }

  const { id } = await context.params;
  const rawFormat = new URL(request.url).searchParams.get("format") ?? "thermal";
  const parsedFormat = formatSchema.safeParse(rawFormat);

  if (!parsedFormat.success) {
    return NextResponse.json({ error: "Format d'impression invalide." }, { status: 400 });
  }

  const pdfFormat = parsedFormat.data as CashClosingPdfFormat;
  const data = await loadCashClosingPdfData(id);

  if (!data) {
    return NextResponse.json({ error: "Clôture introuvable." }, { status: 404 });
  }

  try {
    const pdfBuffer = await renderCashClosingPdf(data, pdfFormat);
    const filename = getCashClosingPdfFilename(data.closingDate);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("cash closing pdf generation failed", error);
    return NextResponse.json({ error: "Impossible de générer le ticket Z." }, { status: 500 });
  }
}
