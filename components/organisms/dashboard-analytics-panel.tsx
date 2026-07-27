import Link from "next/link";

import { RevenueExpenseChart } from "@/components/molecules/revenue-expense-chart";
import type { RevenueExpensePoint } from "@/lib/dashboard/load-analytics";
import type { DashboardChartGranularity } from "@/lib/dashboard/periods";
import { getGranularityLabel } from "@/lib/dashboard/periods";
import { cn } from "@/lib/utils";

type DashboardAnalyticsPanelProps = {
  granularity: DashboardChartGranularity;
  series: RevenueExpensePoint[];
};

const GRANULARITY_OPTIONS: DashboardChartGranularity[] = ["day", "week", "month"];

function buildDashboardHref(granularity: DashboardChartGranularity) {
  return granularity === "month" ? "/dashboard" : `/dashboard?granularity=${granularity}`;
}

export function DashboardAnalyticsPanel({ granularity, series }: DashboardAnalyticsPanelProps) {
  return (
    <div className="space-y-4" data-testid="dashboard-analytics-panel">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Période du graphique
        </span>
        <div
          className="inline-flex rounded-2xl border border-sky-100 bg-sky-50/50 p-1 dark:border-sky-900 dark:bg-slate-900/50"
          data-testid="dashboard-granularity-switch"
          role="group"
          aria-label="Granularité du graphique"
        >
          {GRANULARITY_OPTIONS.map((option) => {
            const isSelected = granularity === option;

            return (
              <Link
                key={option}
                href={buildDashboardHref(option)}
                scroll={false}
                data-testid={`dashboard-granularity-${option}`}
                aria-current={isSelected ? "page" : undefined}
                className={cn(
                  "min-w-[4.5rem] rounded-xl px-3 py-1.5 text-center text-xs font-medium transition-all duration-200 no-underline",
                  isSelected
                    ? "bg-white text-[#10579F] shadow-sm ring-1 ring-sky-100 dark:bg-slate-800 dark:text-sky-100 dark:ring-sky-900"
                    : "text-slate-500 hover:text-[#10579F] dark:text-slate-400 dark:hover:text-sky-200"
                )}
              >
                {getGranularityLabel(option)}
              </Link>
            );
          })}
        </div>
      </div>

      <RevenueExpenseChart data={series} />
    </div>
  );
}
