"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShieldCheck } from "lucide-react";

import { formatGapDifference } from "@/lib/cash-closing/gap-labels";
import type { PendingCashClosingReviewItem } from "@/lib/cash-closing/load-pending-reviews";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CashClosingPendingReviewsPanelProps = {
  items: PendingCashClosingReviewItem[];
  totalPending: number;
  title?: string;
  description?: string;
};

export function CashClosingPendingReviewsPanel({
  items,
  totalPending,
  title = "Clôtures à écart en attente",
  description,
}: CashClosingPendingReviewsPanelProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="cash-closing-pending-reviews-panel"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description ??
              `${totalPending} clôture${totalPending > 1 ? "s" : ""} avec écart en attente de revue PDG.`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="cash-closing-pending-reviews-empty">
          Aucune clôture en attente pour le moment.
        </p>
      ) : (
        <div className="space-y-3" data-testid="cash-closing-pending-reviews-list">
          {items.map((item) => (
            <article
              key={item.id}
              data-testid={`cash-closing-pending-review-${item.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-white/80 px-3 py-3 dark:border-amber-900 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between sm:px-4"
            >
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/cash-closing/${item.id}`}
                  className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                >
                  {format(new Date(item.date), "d MMM yyyy", { locale: fr })}
                </Link>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {formatGapDifference(item.gapAmount)} · opérateur {item.operator.firstName}{" "}
                  {item.operator.lastName}
                </p>
                {item.notes ? (
                  <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.notes}</p>
                ) : null}
              </div>

              <Link
                href={`/cash-closing/${item.id}`}
                className="inline-flex text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
              >
                Examiner →
              </Link>
            </article>
          ))}
        </div>
      )}

      {totalPending > items.length ? (
        <Link
          href="/cash-closing/approvals"
          className="inline-flex text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
          data-testid="cash-closing-pending-reviews-view-all"
        >
          Voir toutes les demandes ({totalPending})
        </Link>
      ) : null}
    </section>
  );
}
