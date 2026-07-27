"use client";

import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { RevenueExpenseChart } from "@/components/molecules/revenue-expense-chart";
import type { RevenueExpenseComparisonPoint } from "@/lib/dashboard/enrich-series-comparison";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getGranularityLabel, getKpiPeriodLabel } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

type DashboardAnalyticsPanelProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  kpiPeriod: DashboardKpiPeriod;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  projectionPeriod?: DashboardKpiPeriod;
  projectionScenario?: TreasuryProjectionScenario;
  series: RevenueExpenseComparisonPoint[];
};

const KPI_PERIOD_OPTIONS: DashboardKpiPeriod[] = ["month", "quarter", "year"];
const CHART_GRANULARITY_OPTIONS: DashboardChartGranularity[] = ["day", "week", "month", "quarter", "year"];

export function DashboardAnalyticsPanel({
  basePath,
  kpiPeriod,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  projectionPeriod,
  projectionScenario,
  series,
}: DashboardAnalyticsPanelProps) {
  return (
    <div className="space-y-4" data-testid="dashboard-analytics-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <MbokaPeriodSwitch
          label="Période des indicateurs"
          testId="dashboard-kpi-period-switch"
          value={kpiPeriod}
          options={KPI_PERIOD_OPTIONS.map((value) => ({
            value,
            label: getKpiPeriodLabel(value),
          }))}
          buildHref={(value) =>
            buildFinancialDashboardHref(basePath, {
              kpiPeriod: value,
              granularity,
              categoryPeriod,
              occupancyPeriod,
              projectionPeriod,
              projectionScenario,
            })
          }
        />

        <MbokaPeriodSwitch
          label="Granularité du graphique"
          testId="dashboard-granularity-switch"
          value={granularity}
          options={CHART_GRANULARITY_OPTIONS.map((value) => ({
            value,
            label: getGranularityLabel(value),
          }))}
          buildHref={(value) =>
            buildFinancialDashboardHref(basePath, {
              kpiPeriod,
              granularity: value,
              categoryPeriod,
              occupancyPeriod,
              projectionPeriod,
              projectionScenario,
            })
          }
        />
      </div>

      <RevenueExpenseChart data={series} granularity={granularity} />
    </div>
  );
}
