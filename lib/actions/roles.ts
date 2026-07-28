"use server";

import { revalidatePath } from "next/cache";

import { captureAuditRequestContext, writeAuditLog, buildAuditChangeDetails } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { isStealthRole } from "@/lib/stealth";
import { toggleRolePermissionSchema } from "@/lib/validations/role";

export type RoleActionResult = { success: true } | { success: false; error: string };

const ADMIN_ROLES = [ROLES.PDG, ROLES.DIRECTEUR_TECHNIQUE] as const;

export async function toggleRolePermissionAction(formData: FormData): Promise<RoleActionResult> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = toggleRolePermissionSchema.safeParse({
    roleId: formData.get("roleId"),
    permissionSlug: formData.get("permissionSlug"),
    enabled: formData.get("enabled"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { roleId, permissionSlug, enabled } = parsed.data;

  const [role, permission] = await Promise.all([
    prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { select: { id: true, slug: true } } },
    }),
    prisma.permission.findUnique({ where: { slug: permissionSlug } }),
  ]);

  if (!role) {
    return { success: false, error: "Rôle introuvable." };
  }

  if (isStealthRole(role.name)) {
    return { success: false, error: "Ce rôle ne peut pas être modifié." };
  }

  if (!permission) {
    return { success: false, error: "Permission introuvable." };
  }

  const hasPermission = role.permissions.some((item) => item.slug === permissionSlug);

  if (enabled && hasPermission) {
    return { success: true };
  }

  if (!enabled && !hasPermission) {
    return { success: true };
  }

  if (
    !enabled &&
    permissionSlug === PERMISSIONS.USERS_MANAGE &&
    ADMIN_ROLES.includes(role.name as (typeof ADMIN_ROLES)[number])
  ) {
    return {
      success: false,
      error: "La permission IAM ne peut pas être retirée des rôles PDG et Directeur Technique.",
    };
  }

  const beforePermissionSlugs = role.permissions.map((p) => p.slug).sort();
  const afterPermissionSlugs = enabled
    ? [...beforePermissionSlugs, permissionSlug].sort()
    : beforePermissionSlugs.filter((slug) => slug !== permissionSlug);

  const auditMeta = await captureAuditRequestContext();

  await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id: roleId },
      data: {
        permissions: enabled
          ? { connect: { id: permission.id } }
          : { disconnect: { id: permission.id } },
      },
    });

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: enabled ? "ROLE_PERMISSION_GRANTED" : "ROLE_PERMISSION_REVOKED",
      entity: "Role",
      entityId: String(roleId),
      userId: session.user.id,
      details: {
        ...buildAuditChangeDetails(
          { permissionSlugs: beforePermissionSlugs },
          { permissionSlugs: afterPermissionSlugs }
        ),
        roleName: role.name,
        permissionSlug,
        enabled,
        performedBy: session.user.email,
      },
    });
  });

  revalidatePath("/admin/roles");

  return { success: true };
}
