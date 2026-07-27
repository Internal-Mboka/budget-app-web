"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MbokaKpiTrend } from "@/components/molecules/mboka-kpi-trend";
import { formatMoney } from "@/lib/currency";
import { getAccountingModeDescription, type DashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import { formatPercentChangeLabel } from "@/lib/dashboard/percent-change";
import type { RevenueCategoryBreakdownPoint } from "@/lib/dashboard/load-revenue-by-category";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<RevenueCategoryBreakdownPoint["category"], string> = {
  STUDIO_SESSION: "#10579F",
  SERVICES_MIX_MASTER: "#0ea5e9",
  LOCATION_VEHICULE: "#6366f1",
  VENTE_ANNEXE: "#14b8a6",
};

type RevenueByCategoryChartProps = {
  data: RevenueCategoryBreakdownPoint[];
  periodLabel: string;
  total: number;
  totalPercentChange: number | null;
  comparisonLabel: string;
  accountingMode?: DashboardAccountingMode;
  className?: string;
};

function ChartTooltip({
  active,
  payload,
  comparisonLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload?: RevenueCategoryBreakdownPoint }>;
  comparisonLabel: string;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-sky-900 dark:bg-slate-900/95">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">{point.label}</p>
      <p className="text-slate-600 dark:text-slate-300">{formatMoney(point.amount)}</p>
      <p className="text-slate-500 dark:text-slate-400">{point.share.toFixed(1)} % du CA</p>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        {formatPercentChangeLabel(point.percentChange)} {comparisonLabel}
      </p>
    </div>
  );
}

export function RevenueByCategoryChart({
  data,
  periodLabel,
  total,
  totalPercentChange,
  comparisonLabel,
  accountingMode = "accrual",
  className,
}: RevenueByCategoryChartProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6", className)}
      data-testid="dashboard-revenue-by-category-chart"
    >
      <div>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">CA par activité</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {getAccountingModeDescription(accountingMode)} — {periodLabel.toLowerCase()}.
          {total > 0 ? ` Total : ${formatMoney(total)}.` : " Aucun revenu enregistré sur cette période."}
        </p>
        <MbokaKpiTrend
          delta={{
            percentChange: totalPercentChange,
            comparisonLabel,
            polarity: "higher-is-better",
          }}
          testId="dashboard-category-total-delta"
        />
      </div>

      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-sky-100 dark:stroke-slate-800" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => formatMoney(Number(value))} />
            <YAxis type="category" dataKey="label" width={108} tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip comparisonLabel={comparisonLabel} />} cursor={{ fill: "rgba(16, 87, 159, 0.06)" }} />
            <Bar dataKey="amount" name="Chiffre d'affaires" radius={[0, 8, 8, 0]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
