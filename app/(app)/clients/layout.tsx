import { ClientsBackNav } from "@/components/molecules/clients-back-nav";
import { ClientsSubNav } from "@/components/molecules/clients-sub-nav";
import { hasAnyPermission, requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  const canImportExport = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);

  return (
    <div className="space-y-6">
      <ClientsBackNav />
      <ClientsSubNav canImportExport={canImportExport} />
      {children}
    </div>
  );
}
