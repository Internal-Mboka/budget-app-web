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

function isRevenueDetailPath(pathname: string): boolean {
  return /^\/revenues\/[^/]+$/.test(pathname) && pathname !== "/revenues/new";
}

export function RevenuesSubNav() {
  const pathname = usePathname();

  if (isRevenueDetailPath(pathname)) {
    return null;
  }

  const items: SubNavItem[] = [
    {
      href: "/revenues",
      label: "Registre",
      testId: "revenues-subnav-registre",
      isActive: (path) => path === "/revenues",
    },
  ];

  if (pathname !== "/revenues/new") {
    items.push({
      href: "/revenues/new",
      label: "Nouveau revenu",
      testId: "revenues-subnav-new",
      isActive: (path) => path.startsWith("/revenues/new"),
    });
  }

  return (
    <nav
      aria-label="Navigation revenus"
      className="flex flex-wrap gap-2 border-b border-sky-100 pb-4 dark:border-sky-900"
      data-testid="revenues-sub-nav"
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
