import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";

export { canManageAlertSettings } from "./access-policy";
import { canManageAlertSettings } from "./access-policy";

export async function requireAlertSettingsAccess() {
  const session = await requireSession();

  if (!canManageAlertSettings(session.user.roleName)) {
    redirect("/login?error=forbidden");
  }

  return session;
}
