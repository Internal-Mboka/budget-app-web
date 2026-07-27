import { CashClosingApprovalsManagement } from "@/components/organisms/cash-closing-approvals-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import {
  countPendingCashClosingReviews,
  loadPendingCashClosingReviews,
} from "@/lib/cash-closing/load-pending-reviews";
import { PERMISSIONS } from "@/lib/permissions";

export default async function CashClosingApprovalsPage() {
  await requirePermission(PERMISSIONS.CASH_APPROVE_CLOSING);

  const [items, totalPending] = await Promise.all([
    loadPendingCashClosingReviews(50),
    countPendingCashClosingReviews(),
  ]);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Rapprochement"
        title="Revue PDG — clôtures à écart"
        description="Analysez les différences constatées, validez l'écart ou consignez la régularisation comptable."
      />

      <CashClosingApprovalsManagement items={items} totalPending={totalPending} />
    </div>
  );
}
