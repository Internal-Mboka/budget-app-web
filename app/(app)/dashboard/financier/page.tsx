import { DashboardFinancialSection } from "@/components/organisms/dashboard-financial-section";
import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import { CashClosingPendingReviewsPanel } from "@/components/organisms/cash-closing-pending-reviews-panel";
import { OverdueReceivablesPanel } from "@/components/organisms/overdue-receivables-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { ensureRecurringExpenseDuesSynced } from "@/lib/actions/recurring-expenses";
import { enrichRevenueExpenseSeriesWithComparison } from "@/lib/dashboard/enrich-series-comparison";
import { loadDashboardKpis, loadRevenueExpenseSeries } from "@/lib/dashboard/load-analytics";
import { loadDashboardKpiComparison } from "@/lib/dashboard/kpi-comparison";
import {
  countOverdueReceivables,
  DASHBOARD_OVERDUE_PREVIEW_LIMIT,
  getOverdueReceivablesTotal,
  loadOverdueReceivables,
} from "@/lib/dashboard/load-overdue-receivables";
import {
  parseDashboardChartGranularity,
  parseDashboardKpiPeriod,
} from "@/lib/dashboard/periods";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  countPendingExpenseApprovals,
  loadPendingExpenseApprovals,
} from "@/lib/expenses/load-pending-approvals";
import {
  countPendingCashClosingReviews,
  loadPendingCashClosingReviews,
} from "@/lib/cash-closing/load-pending-reviews";
import { countPendingRecurringDues, loadPendingRecurringDues } from "@/lib/expenses/load-recurring-dues";
import { PERMISSIONS } from "@/lib/permissions";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type FinancialDashboardPageProps = {
  searchParams: Promise<{ granularity?: string; kpiPeriod?: string }>;
};

export default async function FinancialDashboardPage({ searchParams }: FinancialDashboardPageProps) {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FINANCIAL);
  const query = await searchParams;
  const kpiPeriod = parseDashboardKpiPeriod(query.kpiPeriod);
  const granularity = parseDashboardChartGranularity(query.granularity);
  const canApproveExpenses = session.user.permissions.includes(PERMISSIONS.FINANCE_APPROVE_EXPENSE);
  const canApproveClosings = session.user.permissions.includes(PERMISSIONS.CASH_APPROVE_CLOSING);

  await ensureRecurringExpenseDuesSynced();

  const [kpis, kpiComparison, rawSeries, recurringDues, recurringDueCount, overdueReceivables, overdueCount, overdueTotal, pendingApprovals, pendingClosingReviews] =
    await Promise.all([
      loadDashboardKpis(kpiPeriod),
      loadDashboardKpiComparison(kpiPeriod),
      loadRevenueExpenseSeries(granularity),
      loadPendingRecurringDues(3),
      countPendingRecurringDues(),
      loadOverdueReceivables(DASHBOARD_OVERDUE_PREVIEW_LIMIT),
      countOverdueReceivables(),
      getOverdueReceivablesTotal(),
      canApproveExpenses
        ? Promise.all([loadPendingExpenseApprovals(5), countPendingExpenseApprovals()]).then(
            ([items, totalPending]) => ({ items, totalPending })
          )
        : Promise.resolve(null),
      canApproveClosings
        ? Promise.all([loadPendingCashClosingReviews(5), countPendingCashClosingReviews()]).then(
            ([items, totalPending]) => ({ items, totalPending })
          )
        : Promise.resolve(null),
    ]);

  const series = enrichRevenueExpenseSeriesWithComparison(rawSeries);

  return (
    <section className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Vue financière"
        description={`Espace comptable de ${session.user.name} — indicateurs, caisse et charges.`}
      />

      <DashboardFinancialSection
        basePath="/dashboard/financier"
        kpis={kpis}
        comparison={kpiComparison}
        series={series}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
      />

      <OverdueReceivablesPanel
        items={overdueReceivables}
        totalOverdue={overdueCount}
        totalAmount={overdueTotal}
        showViewAllLink
      />

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

      {pendingApprovals ? (
        <ExpensePendingApprovalsPanel
          items={pendingApprovals.items}
          totalPending={pendingApprovals.totalPending}
          approvalThreshold={getExpenseApprovalThreshold()}
        />
      ) : null}

      {pendingClosingReviews ? (
        <CashClosingPendingReviewsPanel
          items={pendingClosingReviews.items}
          totalPending={pendingClosingReviews.totalPending}
        />
      ) : null}
    </section>
  );
}
