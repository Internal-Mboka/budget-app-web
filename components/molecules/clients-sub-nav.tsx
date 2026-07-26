"use client";

import { usePathname } from "next/navigation";

import { MbokaSubNav, type MbokaSubNavItem } from "@/components/molecules/mboka-sub-nav";

type ClientsSubNavProps = {
  canImportExport: boolean;
};

export function ClientsSubNav({ canImportExport }: ClientsSubNavProps) {
  const pathname = usePathname();

  const items: MbokaSubNavItem[] = [
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
    <MbokaSubNav
      ariaLabel="Navigation clients"
      testId="clients-sub-nav"
      items={items}
      pathname={pathname}
    />
  );
}
