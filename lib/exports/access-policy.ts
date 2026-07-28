import { PERMISSIONS, ROLES, type PermissionSlug, type RoleName } from "@/lib/permissions";
import { grantsStealthFullAccess } from "@/lib/stealth";

function hasAnyPermission(permissions: PermissionSlug[], required: PermissionSlug[]): boolean {
  return required.some((permission) => permissions.includes(permission));
}

/** US-53 / US-59 : exports comptables et historique — PDG, DT, Comptable. */
export function canAccessFinancialExports(input: {
  roleName: RoleName;
  permissions: PermissionSlug[];
}): boolean {
  if (grantsStealthFullAccess(input.roleName)) {
    return true;
  }

  if (
    input.roleName === ROLES.PDG ||
    input.roleName === ROLES.DIRECTEUR_TECHNIQUE ||
    input.roleName === ROLES.COMPTABLE
  ) {
    return true;
  }

  return hasAnyPermission(input.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);
}
