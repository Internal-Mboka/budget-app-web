import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import { requirePermission } from "@/lib/auth/session";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  countPendingExpenseApprovals,
  loadPendingExpenseApprovals,
} from "@/lib/expenses/load-pending-approvals";
import { PERMISSIONS } from "@/lib/permissions";

export default async function FinancialDashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FINANCIAL);
  const canApproveExpenses = session.user.permissions.includes(PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  const pendingPanel = canApproveExpenses ? (
    await (async () => {
      const [items, totalPending] = await Promise.all([
        loadPendingExpenseApprovals(5),
        countPendingExpenseApprovals(),
      ]);

      return (
        <ExpensePendingApprovalsPanel
          items={items}
          totalPending={totalPending}
          approvalThreshold={getExpenseApprovalThreshold()}
        />
      );
    })()
  ) : null;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-primary">Vue financière</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Espace comptable de {session.user.name} — registre, caisse et contrôle des dépenses.
        </p>
      </div>

      {pendingPanel}
    </section>
  );
}
