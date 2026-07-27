"use client";

import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { getAccountingModeLabel, type DashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import type { DashboardKpiScope } from "@/lib/dashboard/kpi-scope";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

const ACCOUNTING_MODE_OPTIONS: DashboardAccountingMode[] = ["accrual", "cash"];

type DashboardAccountingModeSwitchProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  accountingMode: DashboardAccountingMode;
  kpiPeriod: DashboardKpiPeriod;
  kpiScope: DashboardKpiScope;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  projectionPeriod?: DashboardKpiPeriod;
  projectionScenario?: TreasuryProjectionScenario;
};

export function DashboardAccountingModeSwitch({
  basePath,
  accountingMode,
  kpiPeriod,
  kpiScope,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  projectionPeriod,
  projectionScenario,
}: DashboardAccountingModeSwitchProps) {
  return (
    <MbokaPeriodSwitch
      label="Mode comptable"
      testId="dashboard-accounting-mode-switch"
      value={accountingMode}
      options={ACCOUNTING_MODE_OPTIONS.map((value) => ({
        value,
        label: getAccountingModeLabel(value),
      }))}
      buildHref={(value) =>
        buildFinancialDashboardHref(basePath, {
          kpiPeriod,
          kpiScope,
          accountingMode: value,
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
