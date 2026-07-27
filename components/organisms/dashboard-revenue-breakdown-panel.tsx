"use client";

import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { RevenueByCategoryChart } from "@/components/molecules/revenue-by-category-chart";
import type { RevenueCategoryBreakdownPoint } from "@/lib/dashboard/load-revenue-by-category";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiPeriodLabel } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

type DashboardRevenueBreakdownPanelProps = {
  categoryPeriod: DashboardKpiPeriod;
  kpiPeriod: DashboardKpiPeriod;
  granularity: DashboardChartGranularity;
  occupancyPeriod: DashboardKpiPeriod;
  projectionPeriod: DashboardKpiPeriod;
  projectionScenario: TreasuryProjectionScenario;
  points: RevenueCategoryBreakdownPoint[];
  periodLabel: string;
  total: number;
  totalPercentChange: number | null;
  comparisonLabel: string;
};

const CATEGORY_PERIOD_OPTIONS: DashboardKpiPeriod[] = ["month", "quarter", "year"];

export function DashboardRevenueBreakdownPanel({
  categoryPeriod,
  kpiPeriod,
  granularity,
  occupancyPeriod,
  projectionPeriod,
  projectionScenario,
  points,
  periodLabel,
  total,
  totalPercentChange,
  comparisonLabel,
}: DashboardRevenueBreakdownPanelProps) {
  return (
    <div className="space-y-4" data-testid="dashboard-revenue-breakdown-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <MbokaPeriodSwitch
          label="Période du graphique"
          testId="dashboard-category-period-switch"
          value={categoryPeriod}
          options={CATEGORY_PERIOD_OPTIONS.map((value) => ({
            value,
            label: getKpiPeriodLabel(value),
          }))}
          buildHref={(value) =>
            buildFinancialDashboardHref("/dashboard", {
              kpiPeriod,
              granularity,
              categoryPeriod: value,
              occupancyPeriod,
              projectionPeriod,
              projectionScenario,
            })
          }
        />
      </div>

      <RevenueByCategoryChart
        data={points}
        periodLabel={periodLabel}
        total={total}
        totalPercentChange={totalPercentChange}
        comparisonLabel={comparisonLabel}
      />
    </div>
  );
}
