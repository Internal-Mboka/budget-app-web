import { redirect } from "next/navigation";

import { ClientImportExportPanel } from "@/components/organisms/client-import-export-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasAnyPermission, requireSession } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ClientImportPage() {
  const session = await requireSession();

  const canImportExport = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);

  if (!canImportExport) {
    redirect("/clients");
  }

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Tiers & clients"
        title="Import & export"
        description="Exportez le répertoire avec statut de compte et chiffre d'affaires, ou importez une liste CSV validée."
      />

      <ClientImportExportPanel />
    </div>
  );
}
