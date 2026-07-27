import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { ROLES, type RoleName } from "@/lib/permissions";

/** US-58 : configuration alertes / webhooks — réservée au Directeur Technique (IT). */
export function canManageAlertSettings(roleName: RoleName): boolean {
  return roleName === ROLES.DIRECTEUR_TECHNIQUE;
}

export async function requireAlertSettingsAccess() {
  const session = await requireSession();

  if (!canManageAlertSettings(session.user.roleName)) {
    redirect("/login?error=forbidden");
  }

  return session;
}
