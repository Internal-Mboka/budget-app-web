import type { ReactNode } from "react";

import { MbokaKpiTrend, type KpiTrendDelta } from "@/components/molecules/mboka-kpi-trend";
import { formatMoney } from "@/lib/currency";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaKpiCardProps = {
  label: string;
  value: number;
  hint?: string;
  scope?: "period" | "global";
  delta?: KpiTrendDelta;
  testId?: string;
  className?: string;
  format?: "money" | "percent" | "hours" | "number";
  size?: "default" | "compact" | "stat";
};

const scopeSurfaceClassName = {
  period: "bg-sky-50/70 dark:bg-sky-950/20",
  global: "bg-slate-50/80 dark:bg-slate-800/35",
} as const;

const scopeBadgeClassName = {
  period:
    "rounded-xl border border-sky-100 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#10579F] shadow-sm ring-1 ring-sky-100 dark:border-sky-900 dark:bg-slate-800 dark:text-sky-100 dark:ring-sky-900",
  global:
    "rounded-xl border border-sky-100 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm ring-1 ring-slate-100 dark:border-sky-900 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-800",
} as const;

export function MbokaKpiCard({
  label,
  value,
  hint,
  scope,
  delta,
  testId,
  className,
  format = "money",
  size = "default",
}: MbokaKpiCardProps) {
  const isCompact = size === "compact";
  const isStat = size === "stat";

  const displayValue =
    format === "percent"
      ? `${value.toLocaleString("fr-FR")} %`
      : format === "hours"
        ? `${value.toLocaleString("fr-FR")} h`
        : format === "number"
          ? value.toLocaleString("fr-FR")
          : formatMoney(value);

  if (isStat) {
    return (
      <article
        className={cn(
          "rounded-xl p-3",
          scope ? scopeSurfaceClassName[scope] : "bg-sky-50/40",
          className
        )}
        data-testid={testId}
        data-scope={scope}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          {scope ? (
            <span
              className={scopeBadgeClassName[scope]}
              data-testid={testId ? `${testId}-scope` : undefined}
            >
              {scope === "period" ? "Période" : "Global"}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-[#10579F] dark:text-sky-50 sm:text-2xl">
          {displayValue}
        </p>
        {delta ? (
          <MbokaKpiTrend
            delta={delta}
            testId={testId ? `${testId}-delta` : undefined}
            className="mt-1.5 text-[11px]"
          />
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "rounded-2xl border border-sky-100/80 bg-sky-50/40 shadow-none dark:border-sky-900/80 dark:bg-slate-900/50",
        isCompact ? "p-3.5 sm:p-4" : "rounded-3xl bg-white/80 p-5 shadow-sm dark:bg-slate-900/70",
        className
      )}
      data-testid={testId}
      data-scope={scope}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <p
          className={cn(
            "font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400",
            isCompact ? "text-[10px]" : "text-xs"
          )}
        >
          {label}
        </p>
        {scope ? (
          <span
            className={cn(
              "inline-flex rounded-full font-semibold uppercase tracking-wide",
              isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
              scope === "period"
                ? "bg-sky-100 text-[#10579F] dark:bg-sky-950/60 dark:text-sky-200"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
            data-testid={testId ? `${testId}-scope` : undefined}
          >
            {scope === "period" ? "Période" : "Global"}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "font-semibold text-[#10579F] dark:text-sky-50",
          isCompact ? "mt-2 text-lg sm:text-xl" : "mt-3 text-2xl"
        )}
      >
        {displayValue}
      </p>
      {delta ? <MbokaKpiTrend delta={delta} testId={testId ? `${testId}-delta` : undefined} /> : null}
      {hint ? (
        <p className={cn("text-slate-500 dark:text-slate-400", isCompact ? "mt-1.5 text-[11px]" : "mt-2 text-xs")}>
          {hint}
        </p>
      ) : null}
    </article>
  );
}

export function MbokaKpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(mbokaPanelClassName, "grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4 sm:p-8", className)}
      data-testid="dashboard-kpi-grid"
    >
      {children}
    </section>
  );
}
