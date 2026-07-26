"use client";

import { usePathname } from "next/navigation";

import { MbokaBackLink } from "@/components/molecules/mboka-back-link";

export function ClientsBackNav() {
  const pathname = usePathname();

  if (pathname === "/clients") {
    return null;
  }

  return (
    <MbokaBackLink
      href="/clients"
      label="Retour au répertoire"
      testId="clients-back-link"
    />
  );
}
