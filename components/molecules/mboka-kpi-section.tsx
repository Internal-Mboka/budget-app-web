import type { ReactNode } from "react";
import { CalendarRange, Globe2 } from "lucide-react";

import { MbokaInfoPopover } from "@/components/molecules/mboka-info-popover";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaKpiBoardProps = {
  children: ReactNode;
  headerAction?: ReactNode;
  testId?: string;
  className?: string;
};

/** Carte mère unique — grille KPI dashboard financier (SPEC 10). */
export function MbokaKpiBoard({
  children,
  headerAction,
  testId = "dashboard-kpi-grid",
  className,
}: MbokaKpiBoardProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6", className)}
      data-testid={testId}
      aria-label="Indicateurs financiers"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Indicateurs financiers</h2>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {headerAction}
          <MbokaInfoPopover title="Activité vs position trésorerie" testId="dashboard-kpi-info-popover">
            <p>
              <strong className="font-medium text-slate-700 dark:text-slate-200">Activité sur la période</strong> —
              chiffre d&apos;affaires et dépenses <em>enregistrés</em> sur la période filtrée (date de saisie). Comparatif
              N/N-1 disponible.
            </p>
            <p>
              <strong className="font-medium text-slate-700 dark:text-slate-200">Activité cumulée</strong> — total
              historique des montants enregistrés, toutes périodes confondues. Bascule via le switch « CA &amp;
              dépenses ».
            </p>
            <p>
              <strong className="font-medium text-slate-700 dark:text-slate-200">Encaissements réels</strong> — somme
              des paiements clients effectivement reçus sur la période (date d&apos;encaissement), distincte du CA
              enregistré.
            </p>
            <p>
              <strong className="font-medium text-slate-700 dark:text-slate-200">Trésorerie nette</strong> — solde
              global encaissé moins décaissé, ventilé par canal (espèces, Mobile Money, virement, autre).
            </p>
            <p>
              <strong className="font-medium text-slate-700 dark:text-slate-200">Position trésorerie</strong> — créances
              ouvertes et solde caisse ouvert (espèces + Mobile Money) <em>à l&apos;instant T</em>, indépendamment de la
              période filtrée.
            </p>
          </MbokaInfoPopover>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">{children}</div>
    </section>
  );
}

type MbokaKpiBoardGroupProps = {
  label: string;
  scope: "period" | "global";
  testId: string;
  children: ReactNode;
  className?: string;
  cardsClassName?: string;
};

const groupScopeIcon = {
  period: CalendarRange,
  global: Globe2,
} as const;

export function MbokaKpiBoardGroup({
  label,
  scope,
  testId,
  children,
  className,
  cardsClassName,
}: MbokaKpiBoardGroupProps) {
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
        <ScopeIcon className="size-4 shrink-0 text-sky-400 dark:text-sky-500" aria-hidden="true" />
        <p id={headingId} className="text-sm font-medium text-[#10579F] dark:text-sky-50">
          {label}
        </p>
      </div>
      <div className={cn("grid gap-3 sm:grid-cols-2 sm:gap-4", cardsClassName)}>{children}</div>
    </div>
  );
}
