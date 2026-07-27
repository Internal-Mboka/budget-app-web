"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/currency";
import type { RevenueExpensePoint } from "@/lib/dashboard/load-analytics";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RevenueExpenseChartProps = {
  data: RevenueExpensePoint[];
  className?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-sky-900 dark:bg-slate-900/95">
      <p className="mb-2 font-medium text-slate-700 dark:text-slate-200">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-slate-600 dark:text-slate-300">
          {entry.name} : {formatMoney(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export function RevenueExpenseChart({ data, className }: RevenueExpenseChartProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6", className)}
      data-testid="dashboard-revenue-expense-chart"
    >
      <div>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Revenus vs dépenses</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Comparaison des montants enregistrés sur la période sélectionnée.
        </p>
      </div>

      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-sky-100 dark:stroke-slate-800" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              className="text-slate-500"
            />
            <YAxis tick={{ fontSize: 11 }} width={56} className="text-slate-500" />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenus" fill="#10579F" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" name="Dépenses" fill="#f43f5e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
