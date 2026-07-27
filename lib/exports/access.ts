import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { hasAnyPermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export async function assertFinancialExportSession() {
  const session = await getSession();

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  }

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
    ])
  ) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Export réservé au PDG et au Comptable." }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}
