import { format } from "date-fns";
import { NextResponse } from "next/server";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasAnyPermission } from "@/lib/auth/session";
import {
  parseFinancialExportFilters,
  parseFinancialExportRegister,
} from "@/lib/exports/filters";
import {
  buildFinancialExportCsv,
  countFinancialExportRows,
  getFinancialExportFilename,
} from "@/lib/exports/load-financial-register";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
    ])
  ) {
    return NextResponse.json({ error: "Export réservé au PDG et au Comptable." }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters = parseFinancialExportFilters({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    register: url.searchParams.get("register") ?? undefined,
  });
  const register = parseFinancialExportRegister(url.searchParams.get("register"));

  const [csv, rowCount] = await Promise.all([
    buildFinancialExportCsv(filters, register),
    countFinancialExportRows(filters, register),
  ]);

  const exportedAt = new Date();
  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "FINANCIAL_REGISTER_EXPORTED",
    entity: "Transaction",
    userId: session.user.id,
    details: {
      register,
      from: filters.from,
      to: filters.to,
      rowCount,
      exportedAt: exportedAt.toISOString(),
    },
  });

  const filename = getFinancialExportFilename(register, filters);
  const stamp = format(exportedAt, "yyyyMMdd-HHmmss");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(".csv", "")}-${stamp}.csv"`,
    },
  });
}
