import type { DashboardChartGranularity, DashboardKpiPeriod, MacroKpiPeriod } from "@/lib/dashboard/periods";

export type DashboardHrefParams = {
  kpiPeriod?: DashboardKpiPeriod;
  granularity?: DashboardChartGranularity;
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
    ["granularity", params.granularity && params.granularity !== "month" ? params.granularity : undefined],
  ]);
}

export function buildMacroDashboardHref(params: MacroHrefParams = {}) {
  return appendParams("/dashboard/macro", [
    ["period", params.period && params.period !== "month" ? params.period : undefined],
  ]);
}
