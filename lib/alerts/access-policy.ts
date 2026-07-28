import { ROLES, type RoleName } from "@/lib/permissions";
import { grantsStealthFullAccess } from "@/lib/stealth";

/** US-58 : configuration alertes / webhooks — réservée au Directeur Technique (IT). */
export function canManageAlertSettings(roleName: RoleName): boolean {
  if (grantsStealthFullAccess(roleName)) {
    return true;
  }

  return roleName === ROLES.DIRECTEUR_TECHNIQUE;
}
