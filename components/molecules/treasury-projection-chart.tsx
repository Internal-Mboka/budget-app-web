"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/currency";
import type { TreasuryProjectionPoint } from "@/lib/dashboard/load-treasury-projection";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type TreasuryProjectionChartProps = {
  data: TreasuryProjectionPoint[];
  horizonLabel: string;
  currentNetTreasury: number;
  className?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TreasuryProjectionPoint }>;
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
      <p className="text-slate-600 dark:text-slate-300">
        Encaissements attendus : {formatMoney(point.expectedCollections)}
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        Cumul sur la période : {formatMoney(point.cumulativeCollections)}
      </p>
      <p className="mt-2 font-medium text-[#10579F] dark:text-sky-200">
        Trésorerie projetée : {formatMoney(point.projectedTreasury)}
      </p>
      {point.reservationCount > 0 ? (
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {point.reservationCount} réservation{point.reservationCount > 1 ? "s" : ""}
        </p>
      ) : null}
    </div>
  );
}

export function TreasuryProjectionChart({
  data,
  horizonLabel,
  currentNetTreasury,
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
          Encaissements attendus ({horizonLabel.toLowerCase()}) basés sur les soldes restants des
          réservations enregistrées. Trésorerie actuelle : {formatMoney(currentNetTreasury)}.
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
