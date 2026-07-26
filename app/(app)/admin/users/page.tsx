import { UsersManagement } from "@/components/organisms/users-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";

type AdminUsersPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);
  const params = await searchParams;
  const pagination = parsePagination(params);

  const [total, users, roles] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        roleId: true,
        role: {
          select: { name: true },
        },
      },
    }),
    prisma.role.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const userRows = users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isActive: user.isActive,
    roleId: user.roleId,
    roleName: user.role.name,
  }));

  const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.pageSize);

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Administration"
        title="Gestion des utilisateurs"
        description="Créez, modifiez et bloquez les comptes."
      />

      <UsersManagement
        initialUsers={userRows}
        roles={roles}
        currentUserId={session.user.id}
        pagination={paginationMeta}
      />
    </div>
  );
}
