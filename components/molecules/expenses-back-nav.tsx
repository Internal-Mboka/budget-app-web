"use client";

import { usePathname } from "next/navigation";

import { MbokaBackLink } from "@/components/molecules/mboka-back-link";

function isExpenseDetailPath(pathname: string): boolean {
  return /^\/expenses\/[^/]+$/.test(pathname) && pathname !== "/expenses/new";
}

export function ExpensesBackNav() {
  const pathname = usePathname();

  if (pathname === "/expenses" || pathname === "/expenses/new") {
    return null;
  }

  if (!isExpenseDetailPath(pathname)) {
    return null;
  }

  return (
    <MbokaBackLink href="/expenses" label="Retour au registre" testId="expenses-back-link" />
  );
}
