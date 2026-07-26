import { ClientImportExportPanel } from "@/components/organisms/client-import-export-panel";
import { ClientsManagement } from "@/components/organisms/clients-management";
import { ClientSearchPanel } from "@/components/organisms/client-search-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasAnyPermission, hasPermission, requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ClientsPage() {
  const session = await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  const canViewDetail = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);
  const canEditClient = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_REVENUE);
  const canImportExport = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);

  const clients = await prisma.client.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      tags: true,
      createdAt: true,
    },
  });

  const clientRows = clients.map((client) => ({
    id: client.id,
    name: client.name,
    category: client.category,
    phone: client.phone,
    email: client.email,
    address: client.address,
    notes: client.notes,
    tags: client.tags,
    createdAt: client.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Tiers & clients"
        title="Répertoire clients"
        description="Enregistrez et catégorisez les clients pour la facturation et le suivi des prestations."
      />

      <ClientSearchPanel />

      {canImportExport ? <ClientImportExportPanel /> : null}

      <ClientsManagement
        initialClients={clientRows}
        canViewDetail={canViewDetail}
        canEditClient={canEditClient}
      />
    </div>
  );
}
