import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export type KpiTrendDelta = {
  percentChange: number | null;
  comparisonLabel: string;
  polarity: "higher-is-better" | "lower-is-better";
};

type MbokaKpiTrendProps = {
  delta: KpiTrendDelta;
  testId?: string;
  className?: string;
};

function getTrendPresentation(delta: KpiTrendDelta) {
  const { percentChange, polarity } = delta;

  if (percentChange === null) {
    return {
      Icon: Minus,
      className: "text-slate-400 dark:text-slate-500",
      label: "N/A",
    };
  }

  if (percentChange === 0) {
    return {
      Icon: Minus,
      className: "text-slate-400 dark:text-slate-500",
      label: "0 %",
    };
  }

  const isIncrease = percentChange > 0;
  const isPositive =
    polarity === "higher-is-better" ? isIncrease : !isIncrease;

  return {
    Icon: isIncrease ? ArrowUpRight : ArrowDownRight,
    className: isPositive
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400",
    label: `${isIncrease ? "+" : ""}${percentChange.toLocaleString("fr-FR")} %`,
  };
}

export function MbokaKpiTrend({ delta, testId, className }: MbokaKpiTrendProps) {
  const trend = getTrendPresentation(delta);
  const Icon = trend.Icon;

  return (
    <p
      className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trend.className, className)}
      data-testid={testId}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        {trend.label} {delta.comparisonLabel}
      </span>
    </p>
  );
}
