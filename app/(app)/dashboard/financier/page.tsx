import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { ensureRecurringExpenseDuesSynced } from "@/lib/actions/recurring-expenses";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  countPendingExpenseApprovals,
  loadPendingExpenseApprovals,
} from "@/lib/expenses/load-pending-approvals";
import { countPendingRecurringDues, loadPendingRecurringDues } from "@/lib/expenses/load-recurring-dues";
import { PERMISSIONS } from "@/lib/permissions";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export default async function FinancialDashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FINANCIAL);
  const canApproveExpenses = session.user.permissions.includes(PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  await ensureRecurringExpenseDuesSynced();

  const [recurringDues, recurringDueCount] = await Promise.all([
    loadPendingRecurringDues(3),
    countPendingRecurringDues(),
  ]);

  const pendingPanel = canApproveExpenses
    ? await (async () => {
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
    : null;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-primary">Vue financière</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Espace comptable de {session.user.name} — registre, caisse et charges récurrentes.
        </p>
      </div>

      {recurringDueCount > 0 ? (
        <section
          className={cn(mbokaPanelClassName, "space-y-3 p-5 sm:p-6")}
          data-testid="dashboard-recurring-dues-reminder"
        >
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Rappel échéances récurrentes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {recurringDueCount} échéance{recurringDueCount > 1 ? "s" : ""} à régler
            {recurringDues[0] ? ` — prochaine : ${recurringDues[0].periodLabel}` : ""}.
          </p>
          <Link
            href="/expenses/recurring"
            className="inline-flex text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
          >
            Voir les échéances récurrentes →
          </Link>
        </section>
      ) : null}

      {pendingPanel}
    </section>
  );
}
