import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import type { OverdueReceivablesSummary } from "@/lib/dashboard/load-overdue-receivables";

type OverdueReceivablesSummaryGridProps = {
  summary: OverdueReceivablesSummary;
};

export function OverdueReceivablesSummaryGrid({ summary }: OverdueReceivablesSummaryGridProps) {
  return (
    <MbokaKpiGrid className="sm:grid-cols-2 xl:grid-cols-4">
      <MbokaKpiCard
        label="Créances en souffrance"
        value={summary.count}
        hint="Réservations en attente d'acompte"
        testId="overdue-receivables-summary-count"
        format="number"
      />
      <MbokaKpiCard
        label="Montant total dû"
        value={summary.totalAmount}
        hint="Somme des soldes restants"
        testId="overdue-receivables-summary-amount"
      />
      <MbokaKpiCard
        label="Retard moyen"
        value={summary.averageDaysOverdue}
        hint={`${summary.averageDaysOverdue.toLocaleString("fr-FR")} j en moyenne`}
        testId="overdue-receivables-summary-delay"
        format="number"
      />
      <MbokaKpiCard
        label="Sans e-mail client"
        value={summary.withoutEmailCount}
        hint="Rappel manuel impossible"
        testId="overdue-receivables-summary-no-email"
        format="number"
      />
    </MbokaKpiGrid>
  );
}
