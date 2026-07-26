"use client";

import { usePathname } from "next/navigation";

import { MbokaBackLink } from "@/components/molecules/mboka-back-link";

function isRevenueDetailPath(pathname: string): boolean {
  return /^\/revenues\/[^/]+$/.test(pathname) && pathname !== "/revenues/new";
}

export function RevenuesBackNav() {
  const pathname = usePathname();

  if (pathname === "/revenues" || pathname === "/revenues/new") {
    return null;
  }

  if (!isRevenueDetailPath(pathname)) {
    return null;
  }

  return (
    <MbokaBackLink
      href="/revenues"
      label="Retour au registre"
      testId="revenues-back-link"
    />
  );
}
