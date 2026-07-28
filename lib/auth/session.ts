import { redirect } from "next/navigation";

import type { PermissionSlug } from "@/lib/permissions";

import { getSession } from "./get-session";

export async function requireSession() {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/login");
    }

    return session;
  } catch (error) {
    console.error("Auth session error", error);
    redirect("/login?error=session");
  }
}

export function hasPermission(
  permissions: PermissionSlug[],
  required: PermissionSlug | PermissionSlug[]
): boolean {
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((permission) => permissions.includes(permission));
}

export function hasAnyPermission(
  permissions: PermissionSlug[],
  required: PermissionSlug[]
): boolean {
  return required.some((permission) => permissions.includes(permission));
}

export async function requirePermission(required: PermissionSlug | PermissionSlug[]) {
  const session = await requireSession();

  if (!hasPermission(session.user.permissions, required)) {
    redirect("/login?error=forbidden");
  }

  return session;
}
