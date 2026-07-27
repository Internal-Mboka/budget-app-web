"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getGeneratedExportFormatLabel,
  getGeneratedExportKindLabel,
} from "@/lib/exports/kinds";
import type { ExportHistoryItem } from "@/lib/exports/load-export-history";
import { formatAttachmentSize } from "@/lib/expenses/attachments";
import {
  mbokaButtonOutlineClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ExportsHistoryTableProps = {
  exports: ExportHistoryItem[];
};

function CreatedAtLabel({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(parseISO(isoDate), "d MMM yyyy · HH:mm", { locale: fr }));
  }, [isoDate]);

  return <span suppressHydrationWarning>{label || "—"}</span>;
}

export function ExportsHistoryTable({ exports: items }: ExportsHistoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="exports-history-empty">
        Aucun export archivé pour ces filtres. Générez un document depuis la page Exports pour alimenter
        l&apos;historique.
      </p>
    );
  }

  const countLabel =
    items.length === 1 ? "1 document archivé" : `${items.length} documents archivés`;

  return (
    <section className="space-y-3" data-testid="exports-history-table">
      <p className="text-sm text-slate-500 dark:text-slate-400">{countLabel}</p>

      <div className="space-y-3" data-testid="exports-history-list">
        {items.map((item) => (
          <article
            key={item.id}
            data-testid={`export-history-row-${item.id}`}
            className={cn(mbokaPanelClassName, "space-y-3 p-4 sm:p-5")}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                  {getGeneratedExportKindLabel(item.kind)}
                </p>
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">{item.fileName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <CreatedAtLabel isoDate={item.createdAt} /> · {formatAttachmentSize(item.sizeBytes)} ·{" "}
                  {getGeneratedExportFormatLabel(item.mimeType)} · {item.generatedByName}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/exports/${item.id}/download`}
                  className={cn(mbokaButtonOutlineClassName, "min-w-36")}
                  data-testid={`export-history-download-${item.id}`}
                >
                  <Download className="size-4" />
                  Télécharger
                </a>
                <a
                  href={`/api/exports/${item.id}/download?regenerate=1`}
                  className={cn(mbokaButtonOutlineClassName, "min-w-36")}
                  data-testid={`export-history-regenerate-${item.id}`}
                >
                  <RefreshCw className="size-4" />
                  Régénérer
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
