"use client";

import { usePathname } from "next/navigation";

import { MbokaSubNav, type MbokaSubNavItem } from "@/components/molecules/mboka-sub-nav";

function isExpenseDetailPath(pathname: string): boolean {
  return (
    /^\/expenses\/[^/]+$/.test(pathname) &&
    pathname !== "/expenses/new" &&
    pathname !== "/expenses/staff" &&
    pathname !== "/expenses/approvals" &&
    pathname !== "/expenses/recurring" &&
    !pathname.startsWith("/expenses/recurring/")
  );
}

type ExpensesSubNavProps = {
  showApprovalsNav?: boolean;
};

export function ExpensesSubNav({ showApprovalsNav = false }: ExpensesSubNavProps) {
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
  ];

  if (showApprovalsNav) {
    items.push({
      href: "/expenses/approvals",
      label: "Approbations PDG",
      testId: "expenses-subnav-approvals",
      isActive: (path) => path.startsWith("/expenses/approvals"),
    });
  }

  items.push({
    href: "/expenses/recurring",
    label: "Récurrentes",
    testId: "expenses-subnav-recurring",
    isActive: (path) => path.startsWith("/expenses/recurring"),
  });

  items.push({
    href: "/expenses/new",
    label: "Nouvelle dépense",
    testId: "expenses-subnav-new",
    isActive: (path) => path.startsWith("/expenses/new"),
  });

  return (
    <MbokaSubNav
      ariaLabel="Navigation dépenses"
      testId="expenses-sub-nav"
      items={items}
      pathname={pathname}
    />
  );
}
