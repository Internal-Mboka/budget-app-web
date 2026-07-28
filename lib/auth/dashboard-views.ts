import { PERMISSIONS, type PermissionSlug } from "@/lib/permissions";

export type DashboardView = {
  href: string;
  label: string;
  description: string;
  permission: PermissionSlug;
};

export const DASHBOARD_VIEWS: DashboardView[] = [
  {
    href: "/dashboard",
    label: "Vue complète",
    description: "PDG / DT — pilotage global",
    permission: PERMISSIONS.DASHBOARD_FULL,
  },
  {
    href: "/dashboard/financier",
    label: "Vue financière",
    description: "Comptable — caisse et charges",
    permission: PERMISSIONS.DASHBOARD_FINANCIAL,
  },
  {
    href: "/dashboard/operations",
    label: "Vue opérationnelle",
    description: "Secrétaire — saisie revenus",
    permission: PERMISSIONS.DASHBOARD_OPERATIONAL,
  },
  {
    href: "/dashboard/macro",
    label: "Vue macro",
    description: "Observateur — agrégats",
    permission: PERMISSIONS.DASHBOARD_MACRO,
  },
];

export function getAccessibleDashboardViews(permissions: PermissionSlug[]): DashboardView[] {
  return DASHBOARD_VIEWS.filter((view) => permissions.includes(view.permission));
}

export function shouldShowDashboardViewSwitcher(permissions: PermissionSlug[]): boolean {
  return getAccessibleDashboardViews(permissions).length > 1;
}
