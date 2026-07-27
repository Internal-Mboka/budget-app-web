export type DashboardKpiScope = "period" | "global";

const KPI_SCOPE_VALUES: DashboardKpiScope[] = ["period", "global"];

export function parseDashboardKpiScope(value?: string | string[]): DashboardKpiScope {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && KPI_SCOPE_VALUES.includes(raw as DashboardKpiScope)) {
    return raw as DashboardKpiScope;
  }

  return "period";
}

export function getKpiScopeLabel(scope: DashboardKpiScope): string {
  return scope === "global" ? "Global" : "Période";
}
