import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { requireSession } from "@/lib/auth/session";

export { canAccessFinancialExports } from "./access-policy";
import { canAccessFinancialExports } from "./access-policy";

export const FINANCIAL_EXPORT_ACCESS_MESSAGE =
  "Accès réservé au PDG, au Directeur Technique et au Comptable.";

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
