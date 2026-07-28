import { CashClosingPendingReviewsPanel } from "@/components/organisms/cash-closing-pending-reviews-panel";
import type { PendingCashClosingReviewItem } from "@/lib/cash-closing/load-pending-reviews";

type CashClosingApprovalsManagementProps = {
  items: PendingCashClosingReviewItem[];
  totalPending: number;
};

export function CashClosingApprovalsManagement({
  items,
  totalPending,
}: CashClosingApprovalsManagementProps) {
  return (
    <CashClosingPendingReviewsPanel
      items={items}
      totalPending={totalPending}
      title="File d'approbation PDG — clôtures à écart"
      description={`${totalPending} clôture${totalPending > 1 ? "s" : ""} avec différence en attente d'analyse ou de régularisation.`}
    />
  );
}
