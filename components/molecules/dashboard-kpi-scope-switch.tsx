"use client";

import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { getKpiScopeLabel, type DashboardKpiScope } from "@/lib/dashboard/kpi-scope";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

const KPI_SCOPE_OPTIONS: DashboardKpiScope[] = ["period", "global"];

type DashboardKpiScopeSwitchProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  kpiPeriod: DashboardKpiPeriod;
  kpiScope: DashboardKpiScope;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  projectionPeriod?: DashboardKpiPeriod;
  projectionScenario?: TreasuryProjectionScenario;
};

export function DashboardKpiScopeSwitch({
  basePath,
  kpiPeriod,
  kpiScope,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  projectionPeriod,
  projectionScenario,
}: DashboardKpiScopeSwitchProps) {
  return (
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
  );
}
