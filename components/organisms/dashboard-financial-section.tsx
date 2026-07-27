import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardAnalyticsPanel } from "@/components/organisms/dashboard-analytics-panel";
import { MbokaKpiCard } from "@/components/molecules/mboka-kpi-card";
import { MbokaKpiSection } from "@/components/molecules/mboka-kpi-section";
import type { DashboardKpiComparison } from "@/lib/dashboard/kpi-comparison";
import type { RevenueExpenseComparisonPoint } from "@/lib/dashboard/enrich-series-comparison";
import type { DashboardKpis } from "@/lib/dashboard/load-analytics";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

type DashboardFinancialSectionProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  kpis: DashboardKpis;
  comparison: DashboardKpiComparison;
  series: RevenueExpenseComparisonPoint[];
  kpiPeriod: DashboardKpiPeriod;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  projectionPeriod?: DashboardKpiPeriod;
  projectionScenario?: TreasuryProjectionScenario;
};

export function DashboardFinancialSection({
  basePath,
  kpis,
  comparison,
  series,
  kpiPeriod,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  projectionPeriod,
  projectionScenario,
}: DashboardFinancialSectionProps) {
  const updatedLabel = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });
  const periodHint = kpis.periodLabel;

  return (
    <>
      <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="dashboard-updated-at">
        Données calculées au {updatedLabel}
      </p>

      <div className="space-y-6" data-testid="dashboard-kpi-grid">
        <MbokaKpiSection
          title="Activité enregistrée"
          description={`Montants saisis sur la période sélectionnée (${periodHint.toLowerCase()}). Basés sur la date d'enregistrement des transactions.`}
          testId="dashboard-kpi-section-activity"
        >
          <MbokaKpiCard
            label="Chiffre d'affaires"
            value={kpis.revenueTotal}
            hint={periodHint}
            scope="period"
            testId="dashboard-kpi-revenue"
            delta={{
              percentChange: comparison.revenue.percentChange,
              comparisonLabel: comparison.revenue.comparisonLabel,
              polarity: "higher-is-better",
            }}
          />
          <MbokaKpiCard
            label="Dépenses totales"
            value={kpis.expenseTotal}
            hint={periodHint}
            scope="period"
            testId="dashboard-kpi-expenses"
            delta={{
              percentChange: comparison.expenses.percentChange,
              comparisonLabel: comparison.expenses.comparisonLabel,
              polarity: "lower-is-better",
            }}
          />
        </MbokaKpiSection>

        <MbokaKpiSection
          title="Position de trésorerie"
          description="Instantané global — toutes périodes confondues. Reflète la trésorerie réellement encaissée et les créances ouvertes."
          testId="dashboard-kpi-section-position"
        >
          <MbokaKpiCard
            label="Trésorerie nette"
            value={kpis.netTreasury}
            hint="Encaissements payés − décaissements payés"
            scope="global"
            testId="dashboard-kpi-treasury"
          />
          <MbokaKpiCard
            label="Créances restant dues"
            value={kpis.receivables}
            hint="Soldes impayés clients"
            scope="global"
            testId="dashboard-kpi-receivables"
          />
        </MbokaKpiSection>
      </div>

      <DashboardAnalyticsPanel
        basePath={basePath}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
        categoryPeriod={categoryPeriod}
        occupancyPeriod={occupancyPeriod}
        projectionPeriod={projectionPeriod}
        projectionScenario={projectionScenario}
        series={series}
      />
    </>
  );
}
