import type { GeneratedExportKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { saveGeneratedExportFile } from "@/lib/storage/generated-exports";

export async function persistGeneratedExport(input: {
  kind: GeneratedExportKind;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  context: Record<string, unknown>;
  userId: string;
}): Promise<string | null> {
  try {
    const exportId = crypto.randomUUID();
    const storagePath = await saveGeneratedExportFile({
      exportId,
      fileName: input.fileName,
      bytes: input.bytes,
    });

    await prisma.generatedExport.create({
      data: {
        id: exportId,
        kind: input.kind,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.bytes.byteLength,
        storagePath,
        context: input.context,
        generatedByUserId: input.userId,
      },
    });

    return exportId;
  } catch (error) {
    console.error("[export:persist-error]", input.kind, error);
    return null;
  }
}
