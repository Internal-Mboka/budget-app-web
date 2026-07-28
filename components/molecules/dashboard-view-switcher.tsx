"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { DashboardView } from "@/lib/auth/dashboard-views";
import { cn } from "@/lib/utils";

type DashboardViewSwitcherProps = {
  views: DashboardView[];
  className?: string;
  onNavigate?: () => void;
};

function isDashboardViewActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardViewSwitcher({ views, className, onNavigate }: DashboardViewSwitcherProps) {
  const pathname = usePathname();

  if (views.length <= 1) {
    return null;
  }

  return (
    <div
      className={cn("space-y-1 pl-3", className)}
      data-testid="dashboard-view-switcher"
      aria-label="Changer de vue dashboard"
    >
      {views.map((view) => {
        const active = isDashboardViewActive(pathname, view.href);

        return (
          <Link
            key={view.href}
            href={view.href}
            title={view.description}
            onClick={onNavigate}
            data-testid={`dashboard-view-${view.href.replaceAll("/", "-").replace(/^-/, "")}`}
            className={cn(
              "flex min-h-9 items-center rounded-lg px-3 py-2 text-xs font-medium transition",
              active
                ? "bg-sky-100 text-[#10579F] ring-1 ring-sky-200 dark:bg-slate-800 dark:text-sky-50 dark:ring-sky-800"
                : "text-slate-500 hover:bg-sky-50/70 hover:text-[#10579F] dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-sky-50"
            )}
          >
            {view.label}
          </Link>
        );
      })}
    </div>
  );
}
