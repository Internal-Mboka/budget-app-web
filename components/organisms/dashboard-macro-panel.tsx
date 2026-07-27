"use client";

import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { RevenueTrendLineChart } from "@/components/molecules/revenue-trend-line-chart";
import type { RevenueExpensePoint } from "@/lib/dashboard/load-analytics";
import { buildMacroDashboardHref } from "@/lib/dashboard/list-url";
import type { MacroKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiPeriodLabel } from "@/lib/dashboard/periods";

type DashboardMacroPanelProps = {
  period: MacroKpiPeriod;
  series: RevenueExpensePoint[];
};

const MACRO_PERIOD_OPTIONS: MacroKpiPeriod[] = ["month", "quarter", "year"];

export function DashboardMacroPanel({ period, series }: DashboardMacroPanelProps) {
  return (
    <div className="space-y-4" data-testid="dashboard-macro-panel">
      <MbokaPeriodSwitch
        label="Période"
        testId="dashboard-macro-period-switch"
        value={period}
        options={MACRO_PERIOD_OPTIONS.map((value) => ({
          value,
          label: getKpiPeriodLabel(value),
        }))}
        buildHref={(value) => buildMacroDashboardHref({ period: value })}
      />

      <RevenueTrendLineChart
        data={series}
        title="Tendance du chiffre d'affaires"
        description="Vue agrégée — aucun détail client, dépense ou paie n'est affiché."
        testId="dashboard-macro-revenue-trend"
      />
    </div>
  );
}
