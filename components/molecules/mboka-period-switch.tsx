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
  disabled?: boolean;
};

export function MbokaPeriodSwitch<T extends string>({
  label,
  options,
  value,
  buildHref,
  testId,
  disabled = false,
}: MbokaPeriodSwitchProps<T>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", disabled && "opacity-60")}
      aria-disabled={disabled || undefined}
    >
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500",
          disabled && "text-slate-300 dark:text-slate-600"
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "inline-flex flex-wrap rounded-2xl border border-sky-100 bg-sky-50/50 p-1 dark:border-sky-900 dark:bg-slate-900/50",
          disabled && "cursor-not-allowed border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30"
        )}
        data-testid={testId}
        data-disabled={disabled ? "true" : undefined}
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const optionClassName = cn(
            "min-w-[4.5rem] rounded-xl px-3 py-1.5 text-center text-xs font-medium transition-all duration-200",
            isSelected
              ? "bg-white text-[#10579F] shadow-sm ring-1 ring-sky-100 dark:bg-slate-800 dark:text-sky-100 dark:ring-sky-900"
              : "text-slate-500 dark:text-slate-400",
            disabled
              ? "pointer-events-none cursor-not-allowed"
              : "no-underline hover:text-[#10579F] dark:hover:text-sky-200"
          );

          if (disabled) {
            return (
              <span
                key={option.value}
                data-testid={`${testId}-${option.value}`}
                aria-current={isSelected ? "page" : undefined}
                aria-disabled="true"
                className={optionClassName}
              >
                {option.label}
              </span>
            );
          }

          return (
            <Link
              key={option.value}
              href={buildHref(option.value)}
              scroll={false}
              data-testid={`${testId}-${option.value}`}
              aria-current={isSelected ? "page" : undefined}
              className={optionClassName}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
