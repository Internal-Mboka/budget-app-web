import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CashClosingsHistoryFilters } from "@/components/organisms/cash-closings-history-filters";
import { CashClosingsHistoryTable } from "@/components/organisms/cash-closings-history-table";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import {
  loadCashClosingsHistory,
  parseCashClosingHistoryFilters,
} from "@/lib/cash-closing/load-closings";
import { PERMISSIONS } from "@/lib/permissions";

type CashClosingHistoryPageProps = {
  searchParams: Promise<{ from?: string; to?: string; discrepancy?: string }>;
};

export default async function CashClosingHistoryPage({ searchParams }: CashClosingHistoryPageProps) {
  await requirePermission(PERMISSIONS.CASH_CLOSE);
  const query = await searchParams;
  const filters = parseCashClosingHistoryFilters(query);
  const closings = await loadCashClosingsHistory(filters);

  return (
    <div className="space-y-6">
      <Link
        href="/cash-closing"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
        data-testid="cash-closing-history-back-link"
      >
        <ArrowLeft className="size-4" />
        Retour à la clôture
      </Link>

      <MbokaPageHeader
        eyebrow="Rapprochement"
        title="Historique des clôtures"
        description="Chaque carte correspond à une soirée de caisse clôturée. Cliquez pour voir le détail (comptage, écarts, notes). Utilisez les filtres pour retrouver une date ou n'afficher que les clôtures avec différence."
      />

      <CashClosingsHistoryFilters
        from={filters.from}
        to={filters.to}
        discrepancy={filters.discrepancy ?? "all"}
      />

      <CashClosingsHistoryTable closings={closings} />
    </div>
  );
}
