import type { DashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import type { DashboardKpiScope } from "@/lib/dashboard/kpi-scope";
import type { DashboardChartGranularity, DashboardKpiPeriod, MacroKpiPeriod } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

export type DashboardHrefParams = {
  kpiPeriod?: DashboardKpiPeriod;
  kpiScope?: DashboardKpiScope;
  accountingMode?: DashboardAccountingMode;
  granularity?: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  projectionPeriod?: DashboardKpiPeriod;
  projectionScenario?: TreasuryProjectionScenario;
};

export type MacroHrefParams = {
  period?: MacroKpiPeriod;
};

function appendParams(basePath: string, entries: Array<[string, string | undefined]>) {
  const params = new URLSearchParams();

  for (const [key, value] of entries) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function buildFinancialDashboardHref(
  basePath: "/dashboard" | "/dashboard/financier",
  params: DashboardHrefParams = {}
) {
  return appendParams(basePath, [
    ["kpiPeriod", params.kpiPeriod && params.kpiPeriod !== "month" ? params.kpiPeriod : undefined],
    ["kpiScope", params.kpiScope && params.kpiScope !== "period" ? params.kpiScope : undefined],
    [
      "accountingMode",
      params.accountingMode && params.accountingMode !== "accrual" ? params.accountingMode : undefined,
    ],
    ["granularity", params.granularity && params.granularity !== "month" ? params.granularity : undefined],
    [
      "categoryPeriod",
      params.categoryPeriod && params.categoryPeriod !== "month" ? params.categoryPeriod : undefined,
    ],
    [
      "occupancyPeriod",
      params.occupancyPeriod && params.occupancyPeriod !== "month" ? params.occupancyPeriod : undefined,
    ],
    [
      "projectionPeriod",
      params.projectionPeriod && params.projectionPeriod !== "month" ? params.projectionPeriod : undefined,
    ],
    [
      "projectionScenario",
      params.projectionScenario && params.projectionScenario !== "probable"
        ? params.projectionScenario
        : undefined,
    ],
  ]);
}

export function buildMacroDashboardHref(params: MacroHrefParams = {}) {
  return appendParams("/dashboard/macro", [
    ["period", params.period && params.period !== "month" ? params.period : undefined],
  ]);
}
