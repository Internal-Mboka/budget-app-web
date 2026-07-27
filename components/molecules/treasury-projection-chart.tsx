"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/currency";
import type { TreasuryProjectionPoint } from "@/lib/dashboard/load-treasury-projection";
import {
  getProjectionScenarioHint,
  getProjectionScenarioLabel,
  type TreasuryProjectionScenario,
} from "@/lib/dashboard/treasury-projection-scenarios";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type TreasuryProjectionChartProps = {
  data: TreasuryProjectionPoint[];
  horizonLabel: string;
  currentNetTreasury: number;
  scenario: TreasuryProjectionScenario;
  className?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TreasuryProjectionPoint; value?: number; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-sky-900 dark:bg-slate-900/95">
      <p className="mb-2 font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <p className="text-emerald-700 dark:text-emerald-300">
        Encaissements : {formatMoney(point.expectedCollections)}
      </p>
      <p className="text-rose-600 dark:text-rose-300">
        Décaissements : {formatMoney(point.expectedDisbursements)}
      </p>
      <p className="text-slate-600 dark:text-slate-300">Flux net : {formatMoney(point.netFlow)}</p>
      <p className="mt-2 font-medium text-[#10579F] dark:text-sky-200">
        Trésorerie projetée : {formatMoney(point.projectedTreasury)}
      </p>
      {point.reservationCount + point.expenseCount > 0 ? (
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {point.reservationCount > 0
            ? `${point.reservationCount} encaissement${point.reservationCount > 1 ? "s" : ""}`
            : null}
          {point.reservationCount > 0 && point.expenseCount > 0 ? " · " : null}
          {point.expenseCount > 0
            ? `${point.expenseCount} décaissement${point.expenseCount > 1 ? "s" : ""}`
            : null}
        </p>
      ) : null}
    </div>
  );
}

export function TreasuryProjectionChart({
  data,
  horizonLabel,
  currentNetTreasury,
  scenario,
  className,
}: TreasuryProjectionChartProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6", className)}
      data-testid="dashboard-treasury-projection-chart"
    >
      <div>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
          Projection de trésorerie
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Scénario {getProjectionScenarioLabel(scenario).toLowerCase()} — {getProjectionScenarioHint(scenario)}{" "}
          Horizon : {horizonLabel.toLowerCase()}. Trésorerie actuelle : {formatMoney(currentNetTreasury)}.
        </p>
      </div>

      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="treasuryProjectionFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10579F" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10579F" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="projectedTreasury"
              name="Trésorerie projetée"
              stroke="#10579F"
              strokeWidth={2.5}
              fill="url(#treasuryProjectionFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cumulativeNetFlow"
              name="Flux net cumulé"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
