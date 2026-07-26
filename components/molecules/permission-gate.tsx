import type { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/session";
import type { PermissionSlug } from "@/lib/permissions";

type PermissionGateProps = {
  permission: PermissionSlug | PermissionSlug[];
  children: ReactNode;
  fallback?: ReactNode;
};

export async function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const session = await auth();

  if (!session?.user || !hasPermission(session.user.permissions, permission)) {
    return fallback;
  }

  return children;
}
