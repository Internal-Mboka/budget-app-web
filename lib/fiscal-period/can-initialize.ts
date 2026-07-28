import { ROLES, type RoleName } from "@/lib/permissions";

/** US-75 : ouverture du 1er trimestre réservée à la direction (PDG ou DT). */
export function canInitializeFiscalPeriod(roleName: RoleName): boolean {
  return roleName === ROLES.PDG || roleName === ROLES.DIRECTEUR_TECHNIQUE;
}
