import { UsersManagement } from "@/components/organisms/users-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";

export default async function AdminUsersPage() {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
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
      />
    </div>
  );
}
