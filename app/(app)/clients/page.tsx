import { ClientImportExportPanel } from "@/components/organisms/client-import-export-panel";
import { ClientsManagement } from "@/components/organisms/clients-management";
import { ClientSearchPanel } from "@/components/organisms/client-search-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasAnyPermission, hasPermission, requirePermission } from "@/lib/auth/session";
import { parseClientTagsParam } from "@/lib/clients/list-url";
import { collectDistinctTags } from "@/lib/clients/tags";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

type ClientsPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string; tags?: string }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const session = await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);
  const params = await searchParams;
  const pagination = parsePagination(params);
  const selectedTags = parseClientTagsParam(params.tags);

  const canViewDetail = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);
  const canEditClient = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_REVENUE);
  const canImportExport = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);

  const where: Prisma.ClientWhereInput =
    selectedTags.length > 0
      ? {
          AND: selectedTags.map((tag) => ({
            tags: { has: tag },
          })),
        }
      : {};

  const [total, clients, tagSourceRows] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: [{ name: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
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
    }),
    prisma.client.findMany({
      select: { tags: true },
    }),
  ]);

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

  const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.pageSize);
  const availableTags = collectDistinctTags(tagSourceRows);

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
        pagination={paginationMeta}
        selectedTags={selectedTags}
        availableTags={availableTags}
        canViewDetail={canViewDetail}
        canEditClient={canEditClient}
      />
    </div>
  );
}
