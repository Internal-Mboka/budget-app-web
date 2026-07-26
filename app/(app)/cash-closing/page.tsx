import { CashClosingForm } from "@/components/organisms/cash-closing-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { formatClosingDateInput } from "@/lib/cash-closing/day-range";
import { computeCashClosingDaySummary } from "@/lib/cash-closing/theoretical";
import { PERMISSIONS } from "@/lib/permissions";

type CashClosingPageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function CashClosingPage({ searchParams }: CashClosingPageProps) {
  await requirePermission(PERMISSIONS.CASH_CLOSE);
  const query = await searchParams;
  const closingDate = query.date ?? formatClosingDateInput();
  const summary = await computeCashClosingDaySummary(closingDate);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Rapprochement"
        title="Clôture de caisse"
        description="Rapprochez espèces et mobile money : ce que vous comptez réellement vs ce que le registre attend."
      />

      <CashClosingForm summary={summary} defaultClosingDate={closingDate} />
    </div>
  );
}
