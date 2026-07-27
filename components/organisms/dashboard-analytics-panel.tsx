"use client";

import { DashboardAccountingModeSwitch } from "@/components/molecules/dashboard-accounting-mode-switch";
import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { RevenueExpenseChart } from "@/components/molecules/revenue-expense-chart";
import type { RevenueExpenseComparisonPoint } from "@/lib/dashboard/enrich-series-comparison";
import type { DashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import type { DashboardKpiScope } from "@/lib/dashboard/kpi-scope";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getGranularityLabel, getKpiPeriodLabel } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

type DashboardAnalyticsPanelProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  kpiPeriod: DashboardKpiPeriod;
  kpiScope: DashboardKpiScope;
  accountingMode: DashboardAccountingMode;
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
  kpiScope,
  accountingMode,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  projectionPeriod,
  projectionScenario,
  series,
}: DashboardAnalyticsPanelProps) {
  return (
    <div className="space-y-4" data-testid="dashboard-analytics-panel">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="space-y-3">
          <MbokaPeriodSwitch
            label="Période des indicateurs"
            testId="dashboard-kpi-period-switch"
            value={kpiPeriod}
            disabled={kpiScope === "global"}
            options={KPI_PERIOD_OPTIONS.map((value) => ({
              value,
              label: getKpiPeriodLabel(value),
            }))}
            buildHref={(value) =>
              buildFinancialDashboardHref(basePath, {
                kpiPeriod: value,
                kpiScope,
                accountingMode,
                granularity,
                categoryPeriod,
                occupancyPeriod,
                projectionPeriod,
                projectionScenario,
              })
            }
          />
          <DashboardAccountingModeSwitch
            basePath={basePath}
            accountingMode={accountingMode}
            kpiPeriod={kpiPeriod}
            kpiScope={kpiScope}
            granularity={granularity}
            categoryPeriod={categoryPeriod}
            occupancyPeriod={occupancyPeriod}
            projectionPeriod={projectionPeriod}
            projectionScenario={projectionScenario}
          />
        </div>

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
              kpiScope,
              accountingMode,
              granularity: value,
              categoryPeriod,
              occupancyPeriod,
              projectionPeriod,
              projectionScenario,
            })
          }
        />
      </div>

      <RevenueExpenseChart data={series} granularity={granularity} accountingMode={accountingMode} />
    </div>
  );
}
