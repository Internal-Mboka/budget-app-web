import { ClientsManagement } from "@/components/organisms/clients-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ClientsPage() {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  const clients = await prisma.client.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      phone: true,
      email: true,
      createdAt: true,
    },
  });

  const clientRows = clients.map((client) => ({
    id: client.id,
    name: client.name,
    category: client.category,
    phone: client.phone,
    email: client.email,
    createdAt: client.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Tiers & clients"
        title="Répertoire clients"
        description="Enregistrez et catégorisez les clients pour la facturation et le suivi des prestations."
      />

      <ClientsManagement initialClients={clientRows} />
    </div>
  );
}
