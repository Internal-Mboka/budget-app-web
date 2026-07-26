import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  countPendingExpenseApprovals,
  loadPendingExpenseApprovals,
} from "@/lib/expenses/load-pending-approvals";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FULL);
  const canApproveExpenses = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  const pendingApprovals = canApproveExpenses
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
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Vue complète"
        description={`Bienvenue ${session.user.name}. Pilotage macro et micro — modules métier à venir.`}
      />

      {pendingApprovals}

      <section className={cn(mbokaPanelClassName, "grid gap-4 p-6 sm:grid-cols-3 sm:p-8")}>
        {[
          { label: "Chiffre d'affaires", value: "—" },
          { label: "Dépenses", value: "—" },
          { label: "Trésorerie nette", value: "—" },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-sm dark:border-sky-900 dark:bg-slate-900/70"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-primary">{metric.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
