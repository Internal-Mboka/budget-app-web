import type { GeneratedExportKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ExportHistoryFilters = {
  from?: string;
  to?: string;
  kind?: GeneratedExportKind;
};

export type ExportHistoryItem = {
  id: string;
  kind: GeneratedExportKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  generatedByName: string;
};

function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function parseExportHistoryFilters(input: {
  from?: string;
  to?: string;
  kind?: string;
}): ExportHistoryFilters {
  const kind = input.kind?.trim();

  return {
    from: input.from?.trim() || undefined,
    to: input.to?.trim() || undefined,
    kind:
      kind === "FINANCIAL_CSV" ||
      kind === "EXPENSE_RECAP_PDF" ||
      kind === "PERIOD_BALANCE_PDF" ||
      kind === "FISCAL_PERIOD_BALANCE_PDF"
        ? kind
        : undefined,
  };
}

export async function loadExportHistory(filters: ExportHistoryFilters): Promise<ExportHistoryItem[]> {
  const fromDate = parseIsoDate(filters.from);
  const toDate = parseIsoDate(filters.to);

  const createdAtFilter =
    fromDate || toDate
      ? {
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
        }
      : undefined;

  const rows = await prisma.generatedExport.findMany({
    where: {
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      kind: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      generatedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
    generatedByName: `${row.generatedBy.firstName} ${row.generatedBy.lastName}`.trim(),
  }));
}

export async function loadGeneratedExportById(id: string) {
  return prisma.generatedExport.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      storagePath: true,
      context: true,
      createdAt: true,
    },
  });
}
