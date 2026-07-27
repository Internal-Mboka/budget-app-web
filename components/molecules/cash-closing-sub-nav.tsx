"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type CashClosingSubNavProps = {
  showApprovalsNav: boolean;
};

const links = [
  {
    href: "/cash-closing",
    label: "Clôture du jour",
    testId: "cash-closing-subnav-today",
    match: (path: string) => path === "/cash-closing",
  },
  {
    href: "/cash-closing/history",
    label: "Historique",
    testId: "cash-closing-subnav-history",
    match: (path: string) => path.startsWith("/cash-closing/history"),
  },
  {
    href: "/cash-closing/approvals",
    label: "Revue PDG",
    testId: "cash-closing-subnav-approvals",
    match: (path: string) => path.startsWith("/cash-closing/approvals"),
  },
] as const;

export function CashClosingSubNav({ showApprovalsNav }: CashClosingSubNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-sky-100 pb-3 dark:border-sky-900"
      data-testid="cash-closing-subnav"
    >
      {links.map((link) => {
        if (link.href === "/cash-closing/approvals" && !showApprovalsNav) {
          return null;
        }

        const active = link.match(pathname);

        return (
          <Link
            key={link.href}
            href={link.href}
            data-testid={link.testId}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[#10579F] text-white dark:bg-sky-600"
                : "bg-sky-50 text-[#10579F] hover:bg-sky-100 dark:bg-slate-800 dark:text-sky-100 dark:hover:bg-slate-700"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
