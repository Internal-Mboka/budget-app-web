"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type MbokaPeriodSwitchOption<T extends string> = {
  value: T;
  label: string;
};

type MbokaPeriodSwitchProps<T extends string> = {
  label: string;
  options: MbokaPeriodSwitchOption<T>[];
  value: T;
  buildHref: (value: T) => string;
  testId: string;
};

export function MbokaPeriodSwitch<T extends string>({
  label,
  options,
  value,
  buildHref,
  testId,
}: MbokaPeriodSwitchProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      <div
        className="inline-flex flex-wrap rounded-2xl border border-sky-100 bg-sky-50/50 p-1 dark:border-sky-900 dark:bg-slate-900/50"
        data-testid={testId}
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <Link
              key={option.value}
              href={buildHref(option.value)}
              scroll={false}
              data-testid={`${testId}-${option.value}`}
              aria-current={isSelected ? "page" : undefined}
              className={cn(
                "min-w-[4.5rem] rounded-xl px-3 py-1.5 text-center text-xs font-medium transition-all duration-200 no-underline",
                isSelected
                  ? "bg-white text-[#10579F] shadow-sm ring-1 ring-sky-100 dark:bg-slate-800 dark:text-sky-100 dark:ring-sky-900"
                  : "text-slate-500 hover:text-[#10579F] dark:text-slate-400 dark:hover:text-sky-200"
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
