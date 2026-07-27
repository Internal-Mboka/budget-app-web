import type { ReactNode } from "react";

import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaKpiBoardProps = {
  children: ReactNode;
  testId?: string;
  className?: string;
};

/** Conteneur unique pour plusieurs blocs KPI (SPEC 10 — dashboard financier). */
export function MbokaKpiBoard({ children, testId = "dashboard-kpi-grid", className }: MbokaKpiBoardProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "divide-y divide-sky-100 p-5 dark:divide-sky-900 sm:p-6", className)}
      data-testid={testId}
      aria-label="Indicateurs financiers"
    >
      {children}
    </section>
  );
}

type MbokaKpiSectionProps = {
  title: string;
  description: string;
  testId: string;
  children: ReactNode;
  className?: string;
};

export function MbokaKpiSection({ title, description, testId, children, className }: MbokaKpiSectionProps) {
  const headingId = `${testId}-heading`;

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)} data-testid={testId} aria-labelledby={headingId}>
      <header className="space-y-0.5">
        <h2
          id={headingId}
          className="text-sm font-semibold tracking-tight text-[#10579F] dark:text-sky-50"
        >
          {title}
        </h2>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">{children}</div>
    </div>
  );
}
