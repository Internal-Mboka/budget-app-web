import type { ReactNode } from "react";
import { CalendarRange, Globe2, Info } from "lucide-react";

import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaKpiBoardProps = {
  periodLabel: string;
  children: ReactNode;
  testId?: string;
  className?: string;
};

/** Carte mère unique — grille KPI dashboard financier (SPEC 10). */
export function MbokaKpiBoard({
  periodLabel,
  children,
  testId = "dashboard-kpi-grid",
  className,
}: MbokaKpiBoardProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "p-5 sm:p-6", className)}
      data-testid={testId}
      aria-label="Indicateurs financiers"
    >
      <header className="mb-5 flex items-start justify-between gap-3 border-b border-sky-100 pb-4 dark:border-sky-900">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Indicateurs financiers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="size-3 shrink-0" aria-hidden="true" />
              {periodLabel}
            </span>
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span className="inline-flex items-center gap-1">
              <Globe2 className="size-3 shrink-0" aria-hidden="true" />
              Trésorerie globale
            </span>
          </p>
        </div>
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50/60 text-slate-400 dark:border-sky-900 dark:bg-slate-800/60 dark:text-slate-500"
          title="Activité = montants enregistrés sur la période. Trésorerie = encaissements payés et créances ouvertes (toutes périodes)."
          aria-label="Activité = montants enregistrés sur la période. Trésorerie = encaissements payés et créances ouvertes, toutes périodes."
        >
          <Info className="size-4" aria-hidden="true" />
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 lg:divide-x lg:divide-sky-100 dark:lg:divide-sky-900">
        {children}
      </div>
    </section>
  );
}

type MbokaKpiBoardGroupProps = {
  label: string;
  testId: string;
  children: ReactNode;
  className?: string;
};

export function MbokaKpiBoardGroup({ label, testId, children, className }: MbokaKpiBoardGroupProps) {
  const headingId = `${testId}-heading`;

  return (
    <div className={cn("min-w-0 space-y-3 lg:pr-4 last:lg:pl-4 last:lg:pr-0", className)} data-testid={testId} aria-labelledby={headingId}>
      <p
        id={headingId}
        className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-400 dark:text-sky-500"
      >
        {label}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}
