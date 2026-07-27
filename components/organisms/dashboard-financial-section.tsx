import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardAnalyticsPanel } from "@/components/organisms/dashboard-analytics-panel";
import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import type { DashboardKpis, RevenueExpensePoint } from "@/lib/dashboard/load-analytics";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";

type DashboardFinancialSectionProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  kpis: DashboardKpis;
  series: RevenueExpensePoint[];
  kpiPeriod: DashboardKpiPeriod;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
};

export function DashboardFinancialSection({
  basePath,
  kpis,
  series,
  kpiPeriod,
  granularity,
  categoryPeriod,
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
        />
        <MbokaKpiCard
          label="Dépenses totales"
          value={kpis.expenseTotal}
          hint={kpis.periodLabel}
          testId="dashboard-kpi-expenses"
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
        series={series}
      />
    </>
  );
}
