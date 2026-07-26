"use client";

import { usePathname } from "next/navigation";

import { MbokaSubNav, type MbokaSubNavItem } from "@/components/molecules/mboka-sub-nav";

function isExpenseDetailPath(pathname: string): boolean {
  return /^\/expenses\/[^/]+$/.test(pathname) && pathname !== "/expenses/new" && pathname !== "/expenses/staff";
}

export function ExpensesSubNav() {
  const pathname = usePathname();

  if (isExpenseDetailPath(pathname)) {
    return null;
  }

  const items: MbokaSubNavItem[] = [
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
    {
      href: "/expenses/new",
      label: "Nouvelle dépense",
      testId: "expenses-subnav-new",
      isActive: (path) => path.startsWith("/expenses/new"),
    },
  ];

  return (
    <MbokaSubNav
      ariaLabel="Navigation dépenses"
      testId="expenses-sub-nav"
      items={items}
      pathname={pathname}
    />
  );
}
