import { notFound } from "next/navigation";

import { AuditLogDetailPanel } from "@/components/organisms/audit-log-detail-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { loadAuditLogById } from "@/lib/audit/load-logs";
import { PERMISSIONS } from "@/lib/permissions";

type AuditDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AuditDetailPage({ params }: AuditDetailPageProps) {
  await requirePermission(PERMISSIONS.AUDIT_VIEW);
  const { id } = await params;
  const log = await loadAuditLogById(id);

  if (!log) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Traçabilité"
        title="Entrée d'audit"
        description="Inspecteur détaillé avec métadonnées d'accès et comparaison avant/après."
      />

      <AuditLogDetailPanel log={log} />
    </div>
  );
}
