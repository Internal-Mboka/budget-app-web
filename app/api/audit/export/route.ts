import { format } from "date-fns";
import Papa from "papaparse";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { hasAnyPermission, hasPermission } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { loadAuditLogsForExport, parseAuditLogFilters } from "@/lib/audit/load-logs";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (
    !hasAnyPermission(session.user.permissions, [PERMISSIONS.DASHBOARD_FULL, PERMISSIONS.USERS_MANAGE])
  ) {
    return NextResponse.json({ error: "Export réservé à la direction." }, { status: 403 });
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.AUDIT_VIEW)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const url = new URL(request.url);
  const formatParam = url.searchParams.get("format") === "json" ? "json" : "csv";
  const filters = parseAuditLogFilters({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    action: url.searchParams.get("action") ?? undefined,
    entity: url.searchParams.get("entity") ?? undefined,
    userId: url.searchParams.get("userId") ?? undefined,
  });

  const rows = await loadAuditLogsForExport(filters);
  const exportedAt = new Date();

  await writeAuditLog({
    action: "AUDIT_LOG_EXPORTED",
    entity: "AuditLog",
    userId: session.user.id,
    details: {
      format: formatParam,
      from: filters.from ?? null,
      to: filters.to ?? null,
      action: filters.action ?? null,
      entity: filters.entity ?? null,
      userId: filters.userId ?? null,
      rowCount: rows.length,
      exportedAt: exportedAt.toISOString(),
    },
  });

  const stamp = format(exportedAt, "yyyyMMdd-HHmmss");

  if (formatParam === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-logs-${stamp}.json"`,
      },
    });
  }

  const csv = Papa.unparse(
    rows.map((row) => ({
      id: row.id,
      date: row.createdAt,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId ?? "",
      user: row.userName,
      email: row.userEmail,
      ipAddress: row.ipAddress ?? "",
      userAgent: row.userAgent ?? "",
      details: JSON.stringify(row.details ?? {}),
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-logs-${stamp}.csv"`,
    },
  });
}
