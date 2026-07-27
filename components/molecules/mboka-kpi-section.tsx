import type { ReactNode } from "react";
import { CalendarRange, Globe2 } from "lucide-react";

import { MbokaInfoPopover } from "@/components/molecules/mboka-info-popover";
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
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Indicateurs financiers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Vue d&apos;ensemble · {periodLabel.toLowerCase()}</p>
        </div>

        <MbokaInfoPopover title="Comment lire ces indicateurs ?" testId="dashboard-kpi-info-popover">
          <p>
            <strong className="font-medium text-slate-700 dark:text-slate-200">Activité · Période</strong> — montants
            enregistrés sur la période filtrée (date de saisie).
          </p>
          <p>
            <strong className="font-medium text-slate-700 dark:text-slate-200">Trésorerie · Global</strong> — position
            instantanée toutes périodes (encaissements payés et créances ouvertes).
          </p>
        </MbokaInfoPopover>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">{children}</div>
    </section>
  );
}

type MbokaKpiBoardGroupProps = {
  label: string;
  scope: "period" | "global";
  testId: string;
  children: ReactNode;
  className?: string;
};

const groupScopeIcon = {
  period: CalendarRange,
  global: Globe2,
} as const;

export function MbokaKpiBoardGroup({ label, scope, testId, children, className }: MbokaKpiBoardGroupProps) {
  const headingId = `${testId}-heading`;
  const ScopeIcon = groupScopeIcon[scope];

  return (
    <div
      className={cn("min-w-0 space-y-3", className)}
      data-testid={testId}
      data-scope={scope}
      aria-labelledby={headingId}
    >
      <div className="flex items-center gap-1.5">
        <ScopeIcon className="size-3.5 shrink-0 text-sky-400 dark:text-sky-500" aria-hidden="true" />
        <p
          id={headingId}
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-400 dark:text-sky-500"
        >
          {label}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">{children}</div>
    </div>
  );
}
