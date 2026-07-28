import { RolePermissionsMatrix } from "@/components/organisms/role-permissions-matrix";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { stealthRoleWhere } from "@/lib/stealth";

export default async function AdminRolesPage() {
  await requirePermission(PERMISSIONS.USERS_MANAGE);

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      where: stealthRoleWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          select: { slug: true },
        },
      },
    }),
    prisma.permission.findMany({
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        description: true,
      },
    }),
  ]);

  const roleRows = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissionSlugs: role.permissions.map((permission) => permission.slug),
  }));

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Administration"
        title="Permissions par rôle"
        description="Associez ou retirez des habilitations sans redéployer l'application."
      />

      <RolePermissionsMatrix initialRoles={roleRows} permissions={permissions} />
    </div>
  );
}
