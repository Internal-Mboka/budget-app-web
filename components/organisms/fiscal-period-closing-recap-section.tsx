"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart3, Download } from "lucide-react";

import { formatFiscalPeriodRange } from "@/lib/fiscal-period/format";
import type { FiscalPeriodClosingRecap } from "@/lib/fiscal-period/load-closing-recaps";
import { formatMoney } from "@/lib/currency";
import { mbokaButtonPrimaryClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type FiscalPeriodClosingRecapSectionProps = {
  recaps: FiscalPeriodClosingRecap[];
  highlightedPeriodId?: string;
};

function RecapMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/50 px-3 py-2.5 dark:border-sky-900 dark:bg-slate-900/50">
      <dt className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#10579F] dark:text-sky-50">{value}</dd>
    </div>
  );
}

function ClosingRecapCard({
  recap,
  highlighted = false,
}: {
  recap: FiscalPeriodClosingRecap;
  highlighted?: boolean;
}) {
  const { period, snapshot, validatedByPdgName, documentCode } = recap;
  const rangeLabel = formatFiscalPeriodRange(period.startDate, period.endDate);
  const closedLabel = period.closedAt
    ? format(parseISO(period.closedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
    : null;

  return (
    <article
      data-testid={`fiscal-period-closing-recap-${period.label}`}
      className={cn(
        "space-y-4 rounded-2xl border p-4 sm:p-5",
        highlighted
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "border-sky-100 bg-white/80 dark:border-sky-900 dark:bg-slate-900/50"
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-[#10579F] dark:text-sky-50">{period.label}</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Clôturé
          </span>
          {highlighted ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              Dernière clôture
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{rangeLabel}</p>
        {closedLabel ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Clôturé le {closedLabel}</p>
        ) : null}
        {validatedByPdgName ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Validé par {validatedByPdgName}</p>
        ) : null}
        {documentCode ? (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Réf. {documentCode}</p>
        ) : null}
      </div>

      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <RecapMetric label="Revenus" value={formatMoney(snapshot.revenueTotal)} />
        <RecapMetric label="Dépenses" value={formatMoney(snapshot.expenseTotal)} />
        <RecapMetric label="Avoirs / régularisations" value={formatMoney(snapshot.creditTotal)} />
        <RecapMetric label="Solde net" value={formatMoney(snapshot.netBalance)} />
        <RecapMetric label="Trésorerie nette" value={formatMoney(snapshot.netCashFlow)} />
        <RecapMetric
          label="Créances ouvertes"
          value={formatMoney(snapshot.receivableOutstandingTotal)}
        />
      </dl>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {snapshot.revenueCount} revenu{snapshot.revenueCount > 1 ? "s" : ""} · {snapshot.expenseCount}{" "}
        dépense{snapshot.expenseCount > 1 ? "s" : ""} · {snapshot.receivableCount} créance
        {snapshot.receivableCount > 1 ? "s" : ""} reportée{snapshot.receivableCount > 1 ? "s" : ""}
      </p>

      {documentCode ? (
        <a
          href={`/api/exports/fiscal-period-balance/pdf?periodId=${encodeURIComponent(period.id)}`}
          className={cn(mbokaButtonPrimaryClassName, "inline-flex w-fit no-underline")}
          data-testid={`fiscal-period-closing-recap-pdf-${period.label}`}
        >
          <Download className="size-4" />
          Télécharger le bilan PDF
          <span className="sr-only"> ({documentCode})</span>
        </a>
      ) : null}
    </article>
  );
}

export function FiscalPeriodClosingRecapSection({
  recaps,
  highlightedPeriodId,
}: FiscalPeriodClosingRecapSectionProps) {
  if (recaps.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="fiscal-period-closing-recap-section"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-300">
          <BarChart3 className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
            Récapitulatif des trimestres clôturés
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Agrégats figés au moment de la clôture. Les créances ouvertes restent actives sur le trimestre
            suivant.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {recaps.map((recap) => (
          <ClosingRecapCard
            key={recap.period.id}
            recap={recap}
            highlighted={recap.period.id === highlightedPeriodId}
          />
        ))}
      </div>
    </section>
  );
}
