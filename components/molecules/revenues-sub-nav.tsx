"use client";

import { usePathname } from "next/navigation";

import { MbokaSubNav, type MbokaSubNavItem } from "@/components/molecules/mboka-sub-nav";

function isRevenueDetailPath(pathname: string): boolean {
  return /^\/revenues\/[^/]+$/.test(pathname) && pathname !== "/revenues/new";
}

export function RevenuesSubNav() {
  const pathname = usePathname();

  if (isRevenueDetailPath(pathname)) {
    return null;
  }

  const items: MbokaSubNavItem[] = [
    {
      href: "/revenues",
      label: "Registre",
      testId: "revenues-subnav-registre",
      isActive: (path) => path === "/revenues",
    },
    {
      href: "/revenues/planning",
      label: "Planning",
      testId: "revenues-subnav-planning",
      isActive: (path) => path.startsWith("/revenues/planning"),
    },
    {
      href: "/revenues/new",
      label: "Nouveau revenu",
      testId: "revenues-subnav-new",
      isActive: (path) => path.startsWith("/revenues/new"),
    },
  ];

  return (
    <MbokaSubNav
      ariaLabel="Navigation revenus"
      testId="revenues-sub-nav"
      items={items}
      pathname={pathname}
    />
  );
}
