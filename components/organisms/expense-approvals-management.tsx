"use client";

import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import type { PendingExpenseApprovalItem } from "@/lib/expenses/load-pending-approvals";

type ExpenseApprovalsManagementProps = {
  items: PendingExpenseApprovalItem[];
  totalPending: number;
  approvalThreshold?: number;
};

export function ExpenseApprovalsManagement({
  items,
  totalPending,
  approvalThreshold,
}: ExpenseApprovalsManagementProps) {
  return (
    <ExpensePendingApprovalsPanel
      items={items}
      totalPending={totalPending}
      approvalThreshold={approvalThreshold}
      title="File d'approbation PDG"
      description="Validez ou refusez les décaissements majeurs soumis par l'équipe."
    />
  );
}
