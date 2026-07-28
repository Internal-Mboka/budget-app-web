"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, ChevronRight, History } from "lucide-react";
import { useEffect, useState } from "react";

import { CashClosingOperatorCard } from "@/components/molecules/cash-closing-operator-card";
import { formatMoney } from "@/lib/currency";
import type { CashClosingHistoryItem } from "@/lib/cash-closing/load-closings";
import { getClosingReviewStatusLabel, isClosingReviewPending } from "@/lib/cash-closing/review";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CashClosingsHistoryPanelProps = {
  closings: CashClosingHistoryItem[];
};

function ClosingDateLabel({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMM yyyy", { locale: fr }));
  }, [isoDate]);

  return <span suppressHydrationWarning>{label || isoDate}</span>;
}

export function CashClosingsHistoryPanel({ closings }: CashClosingsHistoryPanelProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="cash-closings-history-panel"
    >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <History className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Historique des clôtures</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Opérateur identifié pour chaque clôture — responsabilisation en cas d&apos;écart.
              </p>
            </div>
          </div>
          <Link
            href="/cash-closing/history"
            className="text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
            data-testid="cash-closings-history-full-link"
          >
            Voir tout l&apos;historique →
          </Link>
        </div>

      {closings.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="cash-closings-history-empty">
          Aucune clôture enregistrée pour le moment.
        </p>
      ) : (
        <div className="space-y-3" data-testid="cash-closings-history-list">
          {closings.map((closing) => (
            <article
              key={closing.id}
              data-testid={`cash-closing-history-${closing.id}`}
              className={cn(
                "overflow-hidden rounded-2xl border bg-white/80 dark:bg-slate-900/50",
                closing.hasDiscrepancy
                  ? "border-amber-200 dark:border-amber-900"
                  : "border-slate-100 dark:border-slate-800"
              )}
            >
              <Link
                href={`/cash-closing/${closing.id}`}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
                data-testid={`cash-closing-history-link-${closing.id}`}
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
                  {closing.hasDiscrepancy ? formatMoney(closing.gapAmount) : "OK"}
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
      )}
    </section>
  );
}
