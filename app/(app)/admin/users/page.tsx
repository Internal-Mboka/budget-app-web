import { UsersManagement } from "@/components/organisms/users-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { stealthRoleWhere, stealthUserWhere } from "@/lib/stealth";

type AdminUsersPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);
  const params = await searchParams;
  const pagination = parsePagination(params);

  const [total, users, roles] = await Promise.all([
    prisma.user.count({ where: stealthUserWhere }),
    prisma.user.findMany({
      where: stealthUserWhere,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        accountStatus: true,
        roleId: true,
        role: {
          select: { name: true },
        },
      },
    }),
    prisma.role.findMany({
      where: stealthRoleWhere,
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
    accountStatus: user.accountStatus ?? "ACTIVE",
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
