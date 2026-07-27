import { format } from "date-fns";
import { NextResponse } from "next/server";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { assertFinancialExportSession } from "@/lib/exports/access";
import {
  parseFinancialExportFilters,
  parseFinancialExportRegister,
} from "@/lib/exports/filters";
import {
  buildFinancialExportCsv,
  countFinancialExportRows,
  getFinancialExportFilename,
} from "@/lib/exports/load-financial-register";
import { persistGeneratedExport } from "@/lib/exports/persist-generated-export";

export async function GET(request: Request) {
  const auth = await assertFinancialExportSession();

  if (!auth.ok) {
    return auth.response;
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
    userId: auth.session.user.id,
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
  const stampedFilename = `${filename.replace(".csv", "")}-${stamp}.csv`;
  const bytes = Buffer.from(csv, "utf-8");

  void persistGeneratedExport({
    kind: "FINANCIAL_CSV",
    fileName: stampedFilename,
    mimeType: "text/csv; charset=utf-8",
    bytes,
    context: { register, from: filters.from, to: filters.to },
    userId: auth.session.user.id,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${stampedFilename}"`,
    },
  });
}
