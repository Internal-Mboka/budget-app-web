import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { hasAnyPermission, requireSession } from "@/lib/auth/session";
import { PERMISSIONS, ROLES, type PermissionSlug, type RoleName } from "@/lib/permissions";

export const FINANCIAL_EXPORT_ACCESS_MESSAGE =
  "Accès réservé au PDG, au Directeur Technique et au Comptable.";

/** US-53 / US-59 : exports comptables et historique — PDG, DT, Comptable. */
export function canAccessFinancialExports(input: {
  roleName: RoleName;
  permissions: PermissionSlug[];
}): boolean {
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

export async function requireFinancialExportAccess() {
  const session = await requireSession();

  if (
    !canAccessFinancialExports({
      roleName: session.user.roleName,
      permissions: session.user.permissions,
    })
  ) {
    redirect("/login?error=forbidden");
  }

  return session;
}

export async function assertFinancialExportSession() {
  const session = await getSession();

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  }

  if (
    !canAccessFinancialExports({
      roleName: session.user.roleName,
      permissions: session.user.permissions,
    })
  ) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: FINANCIAL_EXPORT_ACCESS_MESSAGE }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}
