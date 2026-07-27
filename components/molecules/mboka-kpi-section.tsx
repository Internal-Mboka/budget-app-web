import type { ReactNode } from "react";

import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
    <section
      className={cn(mbokaPanelClassName, "space-y-5 p-6 sm:p-8", className)}
      data-testid={testId}
      aria-labelledby={headingId}
    >
      <header className="space-y-1">
        <h2
          id={headingId}
          className="text-sm font-semibold tracking-tight text-[#10579F] dark:text-sky-50"
        >
          {title}
        </h2>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
