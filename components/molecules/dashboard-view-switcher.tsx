"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { DashboardView } from "@/lib/auth/dashboard-views";
import { cn } from "@/lib/utils";

type DashboardViewSwitcherProps = {
  views: DashboardView[];
  className?: string;
};

function isDashboardViewActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardViewSwitcher({ views, className }: DashboardViewSwitcherProps) {
  const pathname = usePathname();

  if (views.length <= 1) {
    return null;
  }

  return (
    <div
      className={cn("space-y-2", className)}
      data-testid="dashboard-view-switcher"
      aria-label="Changer de vue dashboard"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Vues dashboard
      </p>
      <div className="flex flex-wrap gap-2">
        {views.map((view) => {
          const active = isDashboardViewActive(pathname, view.href);

          return (
            <Link
              key={view.href}
              href={view.href}
              title={view.description}
              data-testid={`dashboard-view-${view.href.replaceAll("/", "-").replace(/^-/, "")}`}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "border-[#10579F] bg-[#10579F] text-white dark:border-sky-400 dark:bg-sky-500"
                  : "border-sky-100 bg-white text-[#10579F] hover:bg-sky-50 dark:border-sky-900 dark:bg-slate-900 dark:text-sky-100 dark:hover:bg-slate-800"
              )}
            >
              {view.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
