import { FiscalPeriodClosingPanel } from "@/components/organisms/fiscal-period-closing-panel";
import { FiscalPeriodClosingRecapSection } from "@/components/organisms/fiscal-period-closing-recap-section";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requireSession } from "@/lib/auth/session";
import { canViewFiscalPeriodClosingPage } from "@/lib/fiscal-period/closing-workflow";
import {
  countFiscalPeriodsInClosing,
  loadFiscalPeriodClosingQueue,
} from "@/lib/fiscal-period/load-closing-queue";
import {
  loadFiscalPeriodClosingRecapById,
  loadFiscalPeriodClosingRecaps,
} from "@/lib/fiscal-period/load-closing-recaps";
import { redirect } from "next/navigation";

type FiscalPeriodClosingPageProps = {
  searchParams: Promise<{ visa?: string; approved?: string; periodId?: string }>;
};

export default async function FiscalPeriodClosingPage({ searchParams }: FiscalPeriodClosingPageProps) {
  const session = await requireSession();

  if (!canViewFiscalPeriodClosingPage(session.user.roleName)) {
    redirect("/dashboard?error=forbidden");
  }

  const query = await searchParams;
  const [items, totalPending, recaps] = await Promise.all([
    loadFiscalPeriodClosingQueue(),
    countFiscalPeriodsInClosing(),
    loadFiscalPeriodClosingRecaps(3),
  ]);

  const highlightedPeriodId = query.periodId?.trim() || undefined;
  const highlightedRecap =
    highlightedPeriodId && query.approved === "1"
      ? ((await loadFiscalPeriodClosingRecapById(highlightedPeriodId)) ?? undefined)
      : undefined;

  const displayRecaps =
    highlightedRecap && !recaps.some((recap) => recap.period.id === highlightedRecap.period.id)
      ? [highlightedRecap, ...recaps]
      : recaps;

  let successMessage: string | undefined;

  if (query.approved === "1") {
    successMessage =
      "Clôture trimestrielle finalisée. Le trimestre suivant est ouvert aux saisies financières.";
  } else if (query.visa === "1") {
    successMessage = "Visa comptable enregistré. En attente de la validation PDG.";
  }

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Trimestre comptable"
        title="Clôture trimestrielle"
        description="Validez les trimestres arrivés à échéance : visa Comptable, puis validation PDG uniquement."
      />

      <FiscalPeriodClosingPanel
        items={items}
        totalPending={totalPending}
        roleName={session.user.roleName}
        successMessage={successMessage}
      />

      <FiscalPeriodClosingRecapSection
        recaps={displayRecaps}
        highlightedPeriodId={highlightedPeriodId}
      />
    </div>
  );
}
