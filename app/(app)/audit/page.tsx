import { AuditLogsManagement } from "@/components/organisms/audit-logs-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasAnyPermission, requirePermission } from "@/lib/auth/session";
import { loadAuditActorOptions, loadAuditLogs, parseAuditLogFilters } from "@/lib/audit/load-logs";
import { PERMISSIONS } from "@/lib/permissions";

type AuditPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    action?: string;
    entity?: string;
    userId?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const session = await requirePermission(PERMISSIONS.AUDIT_VIEW);
  const query = await searchParams;
  const filters = parseAuditLogFilters(query);
  const canExport = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.USERS_MANAGE,
  ]);

  const [{ items, pagination }, actors] = await Promise.all([
    loadAuditLogs(filters),
    loadAuditActorOptions(),
  ]);

  const queryString = new URLSearchParams(
    Object.entries(query).flatMap(([key, value]) => (value ? [[key, value]] : []))
  ).toString();

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Traçabilité"
        title="Journaux d'audit"
        description="Consultez les actions sensibles du système — connexions, finances, clôtures et gestion des accès."
      />

      <AuditLogsManagement
        items={items}
        pagination={pagination}
        filters={filters}
        actors={actors}
        canExport={canExport}
        queryString={queryString}
      />
    </div>
  );
}
