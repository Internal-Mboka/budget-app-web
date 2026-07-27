import { access } from "node:fs/promises";

import { NextResponse } from "next/server";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { assertFinancialExportSession } from "@/lib/exports/access";
import { loadGeneratedExportById } from "@/lib/exports/load-export-history";
import { persistGeneratedExport } from "@/lib/exports/persist-generated-export";
import { regenerateExportFile } from "@/lib/exports/regenerate-export";
import { readGeneratedExportFile } from "@/lib/storage/generated-exports";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await assertFinancialExportSession();

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const record = await loadGeneratedExportById(id);

  if (!record) {
    return NextResponse.json({ error: "Export introuvable." }, { status: 404 });
  }

  const url = new URL(request.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "1";
  let bytes: Buffer | null = null;
  let fileName = record.fileName;
  let mimeType = record.mimeType;
  let action: "EXPORT_DOWNLOADED" | "EXPORT_REGENERATED" = "EXPORT_DOWNLOADED";

  if (!forceRegenerate && (await fileExists(record.storagePath))) {
    bytes = await readGeneratedExportFile(record.storagePath);
  } else {
    const regenerated = await regenerateExportFile({
      kind: record.kind,
      context: record.context,
    });

    if (!regenerated) {
      return NextResponse.json(
        { error: "Impossible de régénérer ce document (données source indisponibles)." },
        { status: 404 }
      );
    }

    bytes = regenerated.bytes;
    fileName = regenerated.fileName;
    mimeType = regenerated.mimeType;
    action = "EXPORT_REGENERATED";

    if (forceRegenerate) {
      void persistGeneratedExport({
        kind: record.kind,
        fileName: regenerated.fileName,
        mimeType: regenerated.mimeType,
        bytes: regenerated.bytes,
        context: record.context as Record<string, unknown>,
        userId: auth.session.user.id,
      });
    }
  }

  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action,
    entity: "GeneratedExport",
    entityId: record.id,
    userId: auth.session.user.id,
    details: {
      kind: record.kind,
      fileName,
      regenerated: action === "EXPORT_REGENERATED",
    },
  });

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
