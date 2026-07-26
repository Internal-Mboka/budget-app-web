"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type ClientsSubNavProps = {
  canImportExport: boolean;
};

type SubNavItem = {
  href: string;
  label: string;
  testId?: string;
  isActive: (pathname: string) => boolean;
};

export function ClientsSubNav({ canImportExport }: ClientsSubNavProps) {
  const pathname = usePathname();

  const items: SubNavItem[] = [
    {
      href: "/clients",
      label: "Répertoire",
      testId: "clients-subnav-repertoire",
      isActive: (path) =>
        path === "/clients" ||
        (path.startsWith("/clients/") &&
          !path.startsWith("/clients/new") &&
          !path.startsWith("/clients/import")),
    },
  ];

  if (canImportExport) {
    items.push({
      href: "/clients/import",
      label: "Import / Export",
      testId: "clients-subnav-import",
      isActive: (path) => path.startsWith("/clients/import"),
    });
  }

  return (
    <nav
      aria-label="Navigation clients"
      className="flex flex-wrap gap-2 border-b border-sky-100 pb-4 dark:border-sky-900"
      data-testid="clients-sub-nav"
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
