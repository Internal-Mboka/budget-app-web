import { auth } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/auth/session";
import { buildClientsExportCsv } from "@/lib/clients/export";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const session = await auth();

  if (
    !session?.user ||
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
    ])
  ) {
    return new Response("Accès refusé.", { status: 403 });
  }

  const csv = await buildClientsExportCsv();
  const filename = `clients-mboka-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
