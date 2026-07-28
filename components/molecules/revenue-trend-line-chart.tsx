"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/currency";
import type { RevenueExpensePoint } from "@/lib/dashboard/load-analytics";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RevenueTrendLineChartProps = {
  data: RevenueExpensePoint[];
  title?: string;
  description?: string;
  className?: string;
  testId?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-sky-900 dark:bg-slate-900/95">
      <p className="mb-2 font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <p className="text-slate-600 dark:text-slate-300">Chiffre d&apos;affaires : {formatMoney(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

export function RevenueTrendLineChart({
  data,
  title = "Évolution du chiffre d'affaires",
  description = "Tendance agrégée sans détail opérationnel.",
  className,
  testId = "dashboard-revenue-trend-chart",
}: RevenueTrendLineChartProps) {
  return (
    <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6", className)} data-testid={testId}>
      <div>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">{title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>

      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-sky-100 dark:stroke-slate-800" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} width={56} />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Chiffre d'affaires"
              stroke="#10579F"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
