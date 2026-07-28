import { ExpenseApprovalsManagement } from "@/components/organisms/expense-approvals-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  countPendingExpenseApprovals,
  loadPendingExpenseApprovals,
} from "@/lib/expenses/load-pending-approvals";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ExpenseApprovalsPage() {
  await requirePermission(PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  const [items, totalPending] = await Promise.all([
    loadPendingExpenseApprovals(50),
    countPendingExpenseApprovals(),
  ]);

  const approvalThreshold = getExpenseApprovalThreshold();

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Approbations PDG"
        description="Contrôle des décaissements dépassant le seuil de validation direction."
      />

      <ExpenseApprovalsManagement
        items={items}
        totalPending={totalPending}
        approvalThreshold={approvalThreshold}
      />
    </div>
  );
}
