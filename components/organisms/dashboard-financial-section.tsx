import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardAnalyticsPanel } from "@/components/organisms/dashboard-analytics-panel";
import { MbokaKpiCard } from "@/components/molecules/mboka-kpi-card";
import { MbokaKpiBoard, MbokaKpiBoardGroup } from "@/components/molecules/mboka-kpi-section";
import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import type { DashboardKpiComparison } from "@/lib/dashboard/kpi-comparison";
import type { RevenueExpenseComparisonPoint } from "@/lib/dashboard/enrich-series-comparison";
import type { DashboardKpis } from "@/lib/dashboard/load-analytics";
import { getKpiScopeLabel, type DashboardKpiScope } from "@/lib/dashboard/kpi-scope";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

type DashboardFinancialSectionProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  kpis: DashboardKpis;
  comparison: DashboardKpiComparison;
  series: RevenueExpenseComparisonPoint[];
  kpiPeriod: DashboardKpiPeriod;
  kpiScope: DashboardKpiScope;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  projectionPeriod?: DashboardKpiPeriod;
  projectionScenario?: TreasuryProjectionScenario;
};

const KPI_SCOPE_OPTIONS: DashboardKpiScope[] = ["period", "global"];

export function DashboardFinancialSection({
  basePath,
  kpis,
  comparison,
  series,
  kpiPeriod,
  kpiScope,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  projectionPeriod,
  projectionScenario,
}: DashboardFinancialSectionProps) {
  const updatedLabel = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });
  const activityScope = kpiScope === "global" ? "global" : "period";
  const showActivityDelta = kpiScope === "period";

  return (
    <>
      <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="dashboard-updated-at">
        Données calculées au {updatedLabel}
      </p>

      <MbokaKpiBoard
        periodLabel={kpis.periodLabel}
        headerAction={
          <MbokaPeriodSwitch
            label="Portée Activité"
            testId="dashboard-kpi-scope-switch"
            value={kpiScope}
            options={KPI_SCOPE_OPTIONS.map((value) => ({
              value,
              label: getKpiScopeLabel(value),
            }))}
            buildHref={(value) =>
              buildFinancialDashboardHref(basePath, {
                kpiPeriod,
                kpiScope: value,
                granularity,
                categoryPeriod,
                occupancyPeriod,
                projectionPeriod,
                projectionScenario,
              })
            }
          />
        }
      >
        <MbokaKpiBoardGroup
          label="Activité"
          scope={activityScope}
          testId="dashboard-kpi-section-activity"
        >
          <MbokaKpiCard
            label="Chiffre d'affaires"
            value={kpis.revenueTotal}
            scope={activityScope}
            size="stat"
            testId="dashboard-kpi-revenue"
            delta={
              showActivityDelta
                ? {
                    percentChange: comparison.revenue.percentChange,
                    comparisonLabel: comparison.revenue.comparisonLabel,
                    polarity: "higher-is-better",
                  }
                : undefined
            }
          />
          <MbokaKpiCard
            label="Dépenses totales"
            value={kpis.expenseTotal}
            scope={activityScope}
            size="stat"
            testId="dashboard-kpi-expenses"
            delta={
              showActivityDelta
                ? {
                    percentChange: comparison.expenses.percentChange,
                    comparisonLabel: comparison.expenses.comparisonLabel,
                    polarity: "lower-is-better",
                  }
                : undefined
            }
          />
        </MbokaKpiBoardGroup>

        <MbokaKpiBoardGroup label="Trésorerie" scope="global" testId="dashboard-kpi-section-position">
          <MbokaKpiCard
            label="Trésorerie nette"
            value={kpis.netTreasury}
            hint="Encaissements payés − décaissements payés"
            scope="global"
            size="stat"
            testId="dashboard-kpi-treasury"
          />
          <MbokaKpiCard
            label="Créances restant dues"
            value={kpis.receivables}
            hint="Soldes impayés clients"
            scope="global"
            size="stat"
            testId="dashboard-kpi-receivables"
          />
        </MbokaKpiBoardGroup>
      </MbokaKpiBoard>

      <DashboardAnalyticsPanel
        basePath={basePath}
        kpiPeriod={kpiPeriod}
        kpiScope={kpiScope}
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
