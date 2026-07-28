"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StudioRoomOccupancyPoint } from "@/lib/dashboard/load-studio-occupancy";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const ROOM_COLORS = ["#10579F", "#0ea5e9", "#6366f1", "#14b8a6"];

type StudioOccupancyChartProps = {
  data: StudioRoomOccupancyPoint[];
  periodLabel: string;
  soldHours: number;
  capacityHours: number;
  occupancyRate: number;
  className?: string;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: StudioRoomOccupancyPoint }>;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-sky-900 dark:bg-slate-900/95">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">{point.label}</p>
      <p className="text-slate-600 dark:text-slate-300">
        {point.soldHours.toLocaleString("fr-FR")} h vendues / {point.capacityHours.toLocaleString("fr-FR")} h
        disponibles
      </p>
      <p className="text-slate-500 dark:text-slate-400">{point.occupancyRate.toLocaleString("fr-FR")} %</p>
    </div>
  );
}

export function StudioOccupancyChart({
  data,
  periodLabel,
  soldHours,
  capacityHours,
  occupancyRate,
  className,
}: StudioOccupancyChartProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6", className)}
      data-testid="dashboard-studio-occupancy-chart"
    >
      <div>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Occupation des salles studio</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Heures vendues vs capacité d&apos;ouverture ({periodLabel.toLowerCase()}) — taux global{" "}
          {occupancyRate.toLocaleString("fr-FR")} % ({soldHours.toLocaleString("fr-FR")} h /{" "}
          {capacityHours.toLocaleString("fr-FR")} h). Zone saine : 65–80 %.
        </p>
      </div>

      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-sky-100 dark:stroke-slate-800" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(value) => `${value} %`} />
            <YAxis type="category" dataKey="label" width={108} tick={{ fontSize: 11 }} />
            <ReferenceLine x={65} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "65 %", position: "top", fontSize: 10 }} />
            <ReferenceLine x={80} stroke="#64748b" strokeDasharray="4 4" label={{ value: "80 %", position: "top", fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(16, 87, 159, 0.06)" }} />
            <Bar dataKey="occupancyRate" name="Taux d'occupation" radius={[0, 8, 8, 0]} maxBarSize={28}>
              {data.map((entry, index) => (
                <Cell key={entry.room} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
