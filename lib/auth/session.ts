import { redirect } from "next/navigation";

import type { PermissionSlug } from "@/lib/permissions";

import { getSession } from "./get-session";
import { signOut } from "./instance";

async function resolveSession() {
  try {
    return await getSession();
  } catch (error) {
    console.error("Auth session error", error);
    await signOut({ redirectTo: "/login" });
    redirect("/login");
  }
}

export async function requireSession() {
  const session = await resolveSession();

  if (!session?.user) {
    await signOut({ redirectTo: "/login" });
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
