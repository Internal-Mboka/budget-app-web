import { FinancialExportsPanel } from "@/components/organisms/financial-exports-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasAnyPermission, requireSession } from "@/lib/auth/session";
import { parseFinancialExportFilters } from "@/lib/exports/filters";
import {
  countFinancialExportRows,
  loadRevenuePdfExportItems,
} from "@/lib/exports/load-financial-register";
import { PERMISSIONS } from "@/lib/permissions";
import { redirect } from "next/navigation";

type ExportsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    register?: string;
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

  const [revenueDocuments, revenueDocumentTotal, exportRowCount] = await Promise.all([
    loadRevenuePdfExportItems(filters),
    countFinancialExportRows(filters, "revenues"),
    countFinancialExportRows(filters, filters.register),
  ]);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Archives & exports"
        title="Exports comptables"
        description="Téléchargez les registres CSV et les factures PDF pour la période choisie — archivage externe et transmission comptable."
      />

      <FinancialExportsPanel
        filters={filters}
        revenueDocuments={revenueDocuments}
        revenueDocumentTotal={revenueDocumentTotal}
        exportRowCount={exportRowCount}
      />
    </div>
  );
}
