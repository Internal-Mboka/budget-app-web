import { CashClosingForm } from "@/components/organisms/cash-closing-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { formatClosingDateInput } from "@/lib/cash-closing/day-range";
import { computeTheoreticalCashBalances } from "@/lib/cash-closing/theoretical";
import { PERMISSIONS } from "@/lib/permissions";

type CashClosingPageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function CashClosingPage({ searchParams }: CashClosingPageProps) {
  await requirePermission(PERMISSIONS.CASH_CLOSE);
  const query = await searchParams;
  const closingDate = query.date ?? formatClosingDateInput();
  const theoretical = await computeTheoreticalCashBalances(closingDate);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Rapprochement"
        title="Clôture de caisse"
        description="Saisissez les montants réellement comptés en espèces et mobile money pour valider la journée."
      />

      <CashClosingForm theoretical={theoretical} defaultClosingDate={closingDate} />
    </div>
  );
}
