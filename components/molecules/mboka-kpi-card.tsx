import type { ReactNode } from "react";

import { formatMoney } from "@/lib/currency";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaKpiCardProps = {
  label: string;
  value: number;
  hint?: string;
  testId?: string;
  className?: string;
  format?: "money" | "percent" | "hours";
};

export function MbokaKpiCard({
  label,
  value,
  hint,
  testId,
  className,
  format = "money",
}: MbokaKpiCardProps) {
  const displayValue =
    format === "percent"
      ? `${value.toLocaleString("fr-FR")} %`
      : format === "hours"
        ? `${value.toLocaleString("fr-FR")} h`
        : formatMoney(value);

  return (
    <article
      className={cn(
        "rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-sm dark:border-sky-900 dark:bg-slate-900/70",
        className
      )}
      data-testid={testId}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[#10579F] dark:text-sky-50">{displayValue}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
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
