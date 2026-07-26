import { redirect } from "next/navigation";

import type { PermissionSlug } from "@/lib/permissions";

import { auth } from "./instance";

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export function hasPermission(
  permissions: PermissionSlug[],
  required: PermissionSlug | PermissionSlug[]
): boolean {
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((permission) => permissions.includes(permission));
}

export async function requirePermission(required: PermissionSlug | PermissionSlug[]) {
  const session = await requireSession();

  if (!hasPermission(session.user.permissions, required)) {
    redirect("/login?error=forbidden");
  }

  return session;
}
