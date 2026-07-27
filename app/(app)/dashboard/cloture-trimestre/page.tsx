import { FiscalPeriodClosingPanel } from "@/components/organisms/fiscal-period-closing-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requireSession } from "@/lib/auth/session";
import { canAccessFiscalPeriodClosingPage } from "@/lib/fiscal-period/closing-workflow";
import {
  countFiscalPeriodsInClosing,
  loadFiscalPeriodClosingQueue,
} from "@/lib/fiscal-period/load-closing-queue";
import { redirect } from "next/navigation";

type FiscalPeriodClosingPageProps = {
  searchParams: Promise<{ visa?: string; approved?: string }>;
};

export default async function FiscalPeriodClosingPage({ searchParams }: FiscalPeriodClosingPageProps) {
  const session = await requireSession();

  if (!canAccessFiscalPeriodClosingPage(session.user.roleName)) {
    redirect("/dashboard?error=forbidden");
  }

  const query = await searchParams;
  const [items, totalPending] = await Promise.all([
    loadFiscalPeriodClosingQueue(),
    countFiscalPeriodsInClosing(),
  ]);

  let successMessage: string | undefined;

  if (query.approved === "1") {
    successMessage =
      "Clôture trimestrielle finalisée. Le trimestre suivant est ouvert aux saisies financières.";
  } else if (query.visa === "1") {
    successMessage = "Visa comptable enregistré. En attente de la validation PDG/DT.";
  }

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Trimestre comptable"
        title="Clôture trimestrielle"
        description="Validez les trimestres arrivés à échéance : visa Comptable, puis validation PDG ou Directeur Technique."
      />

      <FiscalPeriodClosingPanel
        items={items}
        totalPending={totalPending}
        roleName={session.user.roleName}
        successMessage={successMessage}
      />
    </div>
  );
}
