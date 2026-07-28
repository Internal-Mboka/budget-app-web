"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { CashClosingOperatorCard } from "@/components/molecules/cash-closing-operator-card";
import { formatGapDifference } from "@/lib/cash-closing/gap-labels";
import type { CashClosingHistoryItem } from "@/lib/cash-closing/load-closings";
import { getClosingReviewStatusLabel, isClosingReviewPending } from "@/lib/cash-closing/review";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CashClosingsHistoryTableProps = {
  closings: CashClosingHistoryItem[];
};

function ClosingDateLabel({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMM yyyy", { locale: fr }));
  }, [isoDate]);

  return <span suppressHydrationWarning>{label || "—"}</span>;
}

export function CashClosingsHistoryTable({ closings }: CashClosingsHistoryTableProps) {
  if (closings.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="cash-closings-history-empty">
        Aucune clôture ne correspond à ces filtres.
      </p>
    );
  }

  const countLabel =
    closings.length === 1 ? "1 clôture trouvée" : `${closings.length} clôtures trouvées`;

  return (
    <section className="space-y-3" data-testid="cash-closings-history-table">
      <p className="text-sm text-slate-500 dark:text-slate-400">{countLabel}</p>

      <div className="space-y-3" data-testid="cash-closings-history-list">
        {closings.map((closing) => (
          <article
            key={closing.id}
            data-testid={`cash-closing-history-row-${closing.id}`}
            className={cn(
              mbokaPanelClassName,
              "overflow-hidden",
              closing.hasDiscrepancy
                ? "border-amber-200 dark:border-amber-900"
                : "border-slate-100 dark:border-slate-800"
            )}
          >
            <Link
              href={`/cash-closing/${closing.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
              data-testid={`cash-closing-history-table-link-${closing.id}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                  <ClosingDateLabel isoDate={closing.date} />
                </span>
                {closing.hasDiscrepancy ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertTriangle className="size-3" />
                    Différence
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="size-3" />
                    Conforme
                  </span>
                )}
                {closing.hasDiscrepancy && isClosingReviewPending(closing.reviewStatus) ? (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    Revue PDG
                  </span>
                ) : null}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {closing.hasDiscrepancy
                  ? formatGapDifference(closing.gapAmount)
                  : "Tout correspond"}
                <ChevronRight className="size-4 text-slate-400" />
              </span>
            </Link>

            <div className="px-2 py-2">
              <CashClosingOperatorCard
                operator={closing.operator}
                emphasized={closing.hasDiscrepancy}
                subtitle={
                  closing.hasDiscrepancy
                    ? isClosingReviewPending(closing.reviewStatus)
                      ? "Responsable identifié — revue PDG en cours"
                      : getClosingReviewStatusLabel(closing.reviewStatus)
                    : "Clôture validée — tout correspondait"
                }
                className="border-0 bg-transparent shadow-none"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
