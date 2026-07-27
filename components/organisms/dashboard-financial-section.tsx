import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardAnalyticsPanel } from "@/components/organisms/dashboard-analytics-panel";
import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import type { DashboardKpiComparison } from "@/lib/dashboard/kpi-comparison";
import type { RevenueExpenseComparisonPoint } from "@/lib/dashboard/enrich-series-comparison";
import type { DashboardKpis } from "@/lib/dashboard/load-analytics";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";

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
}: DashboardFinancialSectionProps) {
  const updatedLabel = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });

  return (
    <>
      <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="dashboard-updated-at">
        Données calculées au {updatedLabel}
      </p>

      <MbokaKpiGrid>
        <MbokaKpiCard
          label="Chiffre d'affaires"
          value={kpis.revenueTotal}
          hint={kpis.periodLabel}
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
          hint={kpis.periodLabel}
          testId="dashboard-kpi-expenses"
          delta={{
            percentChange: comparison.expenses.percentChange,
            comparisonLabel: comparison.expenses.comparisonLabel,
            polarity: "lower-is-better",
          }}
        />
        <MbokaKpiCard
          label="Trésorerie nette"
          value={kpis.netTreasury}
          hint="Encaissements − décaissements (global)"
          testId="dashboard-kpi-treasury"
        />
        <MbokaKpiCard
          label="Créances restant dues"
          value={kpis.receivables}
          hint="Soldes impayés clients"
          testId="dashboard-kpi-receivables"
        />
      </MbokaKpiGrid>

      <DashboardAnalyticsPanel
        basePath={basePath}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
        categoryPeriod={categoryPeriod}
        occupancyPeriod={occupancyPeriod}
        projectionPeriod={projectionPeriod}
        series={series}
      />
    </>
  );
}
