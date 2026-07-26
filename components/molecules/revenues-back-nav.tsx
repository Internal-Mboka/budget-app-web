"use client";

import { usePathname } from "next/navigation";

import { MbokaBackLink } from "@/components/molecules/mboka-back-link";

export function RevenuesBackNav() {
  const pathname = usePathname();

  if (pathname === "/revenues") {
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
