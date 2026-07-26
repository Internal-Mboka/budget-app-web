"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type SubNavItem = {
  href: string;
  label: string;
  testId?: string;
  isActive: (pathname: string) => boolean;
};

function isExpenseDetailPath(pathname: string): boolean {
  return /^\/expenses\/[^/]+$/.test(pathname) && pathname !== "/expenses/new" && pathname !== "/expenses/staff";
}

export function ExpensesSubNav() {
  const pathname = usePathname();

  if (isExpenseDetailPath(pathname)) {
    return null;
  }

  const items: SubNavItem[] = [
    {
      href: "/expenses",
      label: "Registre",
      testId: "expenses-subnav-registre",
      isActive: (path) => path === "/expenses",
    },
    {
      href: "/expenses/staff",
      label: "Paies & cachets",
      testId: "expenses-subnav-staff",
      isActive: (path) => path.startsWith("/expenses/staff"),
    },
  ];

  if (pathname !== "/expenses/new") {
    items.push({
      href: "/expenses/new",
      label: "Nouvelle dépense",
      testId: "expenses-subnav-new",
      isActive: (path) => path.startsWith("/expenses/new"),
    });
  }

  return (
    <nav
      aria-label="Navigation dépenses"
      className="flex flex-wrap gap-2 border-b border-sky-100 pb-4 dark:border-sky-900"
      data-testid="expenses-sub-nav"
    >
      {items.map((item) => {
        const active = item.isActive(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={item.testId}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-[#10579F] text-white shadow-sm dark:bg-sky-500"
                : "bg-sky-50 text-[#10579F] hover:bg-sky-100 dark:bg-slate-800 dark:text-sky-50 dark:hover:bg-slate-700"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
