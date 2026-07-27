import { FinancialExportsPanel } from "@/components/organisms/financial-exports-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import Link from "next/link";
import { hasAnyPermission, requireSession } from "@/lib/auth/session";
import { parseFinancialExportFilters } from "@/lib/exports/filters";
import {
  countFinancialExportRows,
  countExpenseJustificatifExportItems,
  loadExpenseJustificatifExportItems,
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
    justPage?: string;
    justPageSize?: string;
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
  const justPaginationParams = parsePagination({}, {
    pageParam: "justPage",
    pageSizeParam: "justPageSize",
    query,
  });

  const [
    revenueDocuments,
    revenueDocumentTotal,
    exportRowCount,
    periodClosure,
    expenseJustificatifs,
    expenseJustificatifTotal,
  ] = await Promise.all([
    loadRevenuePdfExportItems(filters, {
      skip: paginationParams.skip,
      take: paginationParams.take,
    }),
    countFinancialExportRows(filters, "revenues"),
    countFinancialExportRows(filters, filters.register),
    isFullCivilMonthPeriod(filters) ? loadFinancialPeriodClosureForFilters(filters) : Promise.resolve(null),
    loadExpenseJustificatifExportItems(filters, {
      skip: justPaginationParams.skip,
      take: justPaginationParams.take,
    }),
    countExpenseJustificatifExportItems(filters),
  ]);

  const revenueDocumentsPagination = buildPaginationMeta(
    revenueDocumentTotal,
    paginationParams.page,
    paginationParams.pageSize
  );

  const expenseJustificatifsPagination = buildPaginationMeta(
    expenseJustificatifTotal,
    justPaginationParams.page,
    justPaginationParams.pageSize
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
        descriptionAside={
          <Link
            href="/exports/history"
            className="text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
            data-testid="exports-history-link"
          >
            Voir l&apos;historique des exports
          </Link>
        }
      />

      <FinancialExportsPanel
        filters={filters}
        revenueDocuments={revenueDocuments}
        revenueDocumentsPagination={revenueDocumentsPagination}
        expenseJustificatifs={expenseJustificatifs}
        expenseJustificatifsPagination={expenseJustificatifsPagination}
        exportRowCount={exportRowCount}
        periodClosure={periodClosure}
        canClosePeriod={canClosePeriod}
        closureError={query.closureError ? decodeURIComponent(query.closureError) : undefined}
      />
    </div>
  );
}
