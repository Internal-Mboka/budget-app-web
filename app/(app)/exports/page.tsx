import { FinancialExportsPanel } from "@/components/organisms/financial-exports-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasAnyPermission, requireSession } from "@/lib/auth/session";
import { parseFinancialExportFilters } from "@/lib/exports/filters";
import {
  countFinancialExportRows,
  loadRevenuePdfExportItems,
} from "@/lib/exports/load-financial-register";
import { loadFinancialPeriodClosureForFilters } from "@/lib/period-closure/load-closures";
import { isFullCivilMonthPeriod } from "@/lib/period-closure/dates";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { PERMISSIONS } from "@/lib/permissions";
import { redirect } from "next/navigation";

type ExportsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    register?: string;
    page?: string;
    pageSize?: string;
    closureError?: string;
  }>;
};

export default async function ExportsPage({ searchParams }: ExportsPageProps) {
  const session = await requireSession();

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
    ])
  ) {
    redirect("/login?error=forbidden");
  }

  const query = await searchParams;
  const filters = parseFinancialExportFilters(query);
  const paginationParams = parsePagination(query);

  const [revenueDocuments, revenueDocumentTotal, exportRowCount, periodClosure] = await Promise.all([
    loadRevenuePdfExportItems(filters, {
      skip: paginationParams.skip,
      take: paginationParams.take,
    }),
    countFinancialExportRows(filters, "revenues"),
    countFinancialExportRows(filters, filters.register),
    isFullCivilMonthPeriod(filters) ? loadFinancialPeriodClosureForFilters(filters) : Promise.resolve(null),
  ]);

  const revenueDocumentsPagination = buildPaginationMeta(
    revenueDocumentTotal,
    paginationParams.page,
    paginationParams.pageSize
  );

  const canClosePeriod = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Archives & exports"
        title="Exports comptables"
        description="Exportez vos registres comptables et vos documents PDF pour la période de votre choix."
      />

      <FinancialExportsPanel
        filters={filters}
        revenueDocuments={revenueDocuments}
        revenueDocumentsPagination={revenueDocumentsPagination}
        exportRowCount={exportRowCount}
        periodClosure={periodClosure}
        canClosePeriod={canClosePeriod}
        closureError={query.closureError ? decodeURIComponent(query.closureError) : undefined}
      />
    </div>
  );
}
