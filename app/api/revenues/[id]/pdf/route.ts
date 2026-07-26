import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { loadRevenuePdfData } from "@/lib/revenues/pdf/load-revenue-pdf-data";
import { renderRevenuePdf } from "@/lib/revenues/pdf/render-revenue-pdf";
import { getRevenuePdfFilename, type RevenuePdfDocumentType } from "@/lib/revenues/pdf/types";
import { PERMISSIONS } from "@/lib/permissions";

const documentTypeSchema = z.enum(["proforma", "receipt"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_REVENUE)) {
    return NextResponse.json({ error: "Permission insuffisante." }, { status: 403 });
  }

  const { id } = await context.params;
  const rawType = new URL(request.url).searchParams.get("type") ?? "proforma";
  const parsedType = documentTypeSchema.safeParse(rawType);

  if (!parsedType.success) {
    return NextResponse.json({ error: "Type de document invalide." }, { status: 400 });
  }

  const documentType = parsedType.data as RevenuePdfDocumentType;
  const data = await loadRevenuePdfData(id, documentType);

  if (!data) {
    return NextResponse.json({ error: "Revenu introuvable ou reçu non disponible." }, { status: 404 });
  }

  try {
    const pdfBuffer = await renderRevenuePdf(data);
    const filename = getRevenuePdfFilename(data.code, documentType);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("revenue pdf generation failed", error);
    return NextResponse.json({ error: "Impossible de générer le PDF." }, { status: 500 });
  }
}
