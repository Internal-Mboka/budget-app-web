"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, FileArchive, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  exportKindAllowsLiveRegenerate,
  exportKindUsesArchivedSnapshotOnly,
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
  hasActiveFilters?: boolean;
};

function CreatedAtLabel({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(parseISO(isoDate), "d MMM yyyy · HH:mm", { locale: fr }));
  }, [isoDate]);

  return <span suppressHydrationWarning>{label || "—"}</span>;
}

export function ExportsHistoryTable({ exports: items, hasActiveFilters = false }: ExportsHistoryTableProps) {
  if (items.length === 0) {
    return (
      <section className="space-y-3" data-testid="exports-history-table">
        <div
          className={cn(
            mbokaPanelClassName,
            "mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-16 text-center"
          )}
          data-testid="exports-history-empty"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-300">
            <FileArchive className="size-7" />
          </div>
          <p className="mt-4 text-base font-semibold text-[#10579F] dark:text-sky-50">
            {hasActiveFilters ? "Aucun document ne correspond" : "Rien à afficher pour l'instant"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {hasActiveFilters
              ? "Élargissez la période ou changez le type de fichier, puis réessayez."
              : "Dès que vous exportez un registre ou un PDF, il apparaît ici pour être retéléchargé plus tard."}
          </p>
          <Link
            href="/exports"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
          >
            Aller créer un export
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    );
  }

  const countLabel =
    items.length === 1 ? "1 document enregistré" : `${items.length} documents enregistrés`;

  return (
    <section className="space-y-3" data-testid="exports-history-table">
      <p className="text-sm text-slate-500 dark:text-slate-400">{countLabel}</p>
      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        Pour un audit ou un contrôle, utilisez toujours la <strong className="font-medium">copie archivée</strong>{" "}
        (fichier exact produit à la date indiquée). La regénération ne concerne que les registres CSV et récaps de
        dépenses.
      </p>

      <div className="space-y-3" data-testid="exports-history-list">
        {items.map((item) => (
          <article
            key={item.id}
            data-testid={`export-history-row-${item.id}`}
            className={cn(mbokaPanelClassName, "space-y-3 p-4 sm:p-5")}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                  {getGeneratedExportKindLabel(item.kind)}
                </p>
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">{item.fileName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enregistré le <CreatedAtLabel isoDate={item.createdAt} /> · {formatAttachmentSize(item.sizeBytes)}{" "}
                  · {getGeneratedExportFormatLabel(item.mimeType)} · {item.generatedByName}
                </p>
                {exportKindUsesArchivedSnapshotOnly(item.kind) ? (
                  <p className="text-xs text-sky-700 dark:text-sky-300">
                    Bilan figé à la clôture — seule la copie archivée fait foi.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/exports/${item.id}/download`}
                  className={cn(mbokaButtonOutlineClassName, "min-w-40")}
                  data-testid={`export-history-download-${item.id}`}
                  title="Fichier exact produit à la date d'enregistrement — référence pour l'audit"
                >
                  <Download className="size-4" />
                  Copie archivée
                </a>
                {exportKindAllowsLiveRegenerate(item.kind) ? (
                  <a
                    href={`/api/exports/${item.id}/download?regenerate=1`}
                    className={cn(mbokaButtonOutlineClassName, "min-w-40")}
                    data-testid={`export-history-regenerate-${item.id}`}
                    title="Nouvelle version avec les chiffres actuels — ne remplace pas la copie archivée"
                  >
                    <RefreshCw className="size-4" />
                    Version à jour
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
