"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

export type MbokaSubNavItem = {
  href: string;
  label: string;
  testId?: string;
  isActive: (pathname: string) => boolean;
};

type MbokaSubNavProps = {
  ariaLabel: string;
  testId: string;
  items: MbokaSubNavItem[];
  pathname: string;
};

const tabBaseClassName = "rounded-full px-4 py-2 text-sm font-medium transition";
const tabActiveClassName = "bg-[#10579F] text-white shadow-sm dark:bg-sky-500";
const tabInactiveClassName =
  "bg-sky-50 text-[#10579F] hover:bg-sky-100 dark:bg-slate-800 dark:text-sky-50 dark:hover:bg-slate-700";

export function MbokaSubNav({ ariaLabel, testId, items, pathname }: MbokaSubNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2 border-b border-sky-100 pb-4 dark:border-sky-900"
      data-testid={testId}
    >
      {items.map((item) => {
        const active = item.isActive(pathname);

        if (active) {
          return (
            <span
              key={item.href}
              data-testid={item.testId}
              aria-current="page"
              aria-disabled="true"
              className={cn(tabBaseClassName, tabActiveClassName, "cursor-default")}
            >
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={item.testId}
            className={cn(tabBaseClassName, tabInactiveClassName)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
