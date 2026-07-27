import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExportsHistoryFilters } from "@/components/organisms/exports-history-filters";
import { ExportsHistoryTable } from "@/components/organisms/exports-history-table";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requireFinancialExportAccess } from "@/lib/exports/access";
import { loadExportHistory, parseExportHistoryFilters } from "@/lib/exports/load-export-history";

type ExportsHistoryPageProps = {
  searchParams: Promise<{ from?: string; to?: string; kind?: string }>;
};

export default async function ExportsHistoryPage({ searchParams }: ExportsHistoryPageProps) {
  await requireFinancialExportAccess();

  const query = await searchParams;
  const filters = parseExportHistoryFilters(query);
  const exports = await loadExportHistory(filters);

  return (
    <div className="space-y-6">
      <Link
        href="/exports"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
        data-testid="exports-history-back-link"
      >
        <ArrowLeft className="size-4" />
        Retour aux exports
      </Link>

      <MbokaPageHeader
        eyebrow="Archives & exports"
        title="Historique des exports"
        description="Retrouvez les PDF et CSV déjà générés, avec leur taille et date de création. Téléchargez l'archive ou régénérez le document à partir des données source."
      />

      <ExportsHistoryFilters from={filters.from} to={filters.to} kind={filters.kind} />

      <ExportsHistoryTable exports={exports} />
    </div>
  );
}
