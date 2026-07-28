import { ROLES, type RoleName } from "@/lib/permissions";

/** US-58 : configuration alertes / webhooks — réservée au Directeur Technique (IT). */
export function canManageAlertSettings(roleName: RoleName): boolean {
  return roleName === ROLES.DIRECTEUR_TECHNIQUE;
}
