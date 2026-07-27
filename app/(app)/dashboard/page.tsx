import { DashboardFinancialSection } from "@/components/organisms/dashboard-financial-section";
import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { loadDashboardKpis, loadRevenueExpenseSeries } from "@/lib/dashboard/load-analytics";
import {
  parseDashboardChartGranularity,
  parseDashboardKpiPeriod,
} from "@/lib/dashboard/periods";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  countPendingExpenseApprovals,
  loadPendingExpenseApprovals,
} from "@/lib/expenses/load-pending-approvals";
import { PERMISSIONS } from "@/lib/permissions";

type DashboardPageProps = {
  searchParams: Promise<{ granularity?: string; kpiPeriod?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FULL);
  const query = await searchParams;
  const kpiPeriod = parseDashboardKpiPeriod(query.kpiPeriod);
  const granularity = parseDashboardChartGranularity(query.granularity);
  const canApproveExpenses = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  const [kpis, series, pendingApprovals] = await Promise.all([
    loadDashboardKpis(kpiPeriod),
    loadRevenueExpenseSeries(granularity),
    canApproveExpenses
      ? Promise.all([loadPendingExpenseApprovals(5), countPendingExpenseApprovals()]).then(
          ([items, totalPending]) => ({
            items,
            totalPending,
          })
        )
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Vue complète"
        description={`Bienvenue ${session.user.name}. Pilotage financier du studio — PDG et DT.`}
      />

      <DashboardFinancialSection
        basePath="/dashboard"
        kpis={kpis}
        series={series}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
      />

      {pendingApprovals ? (
        <ExpensePendingApprovalsPanel
          items={pendingApprovals.items}
          totalPending={pendingApprovals.totalPending}
          approvalThreshold={getExpenseApprovalThreshold()}
        />
      ) : null}
    </div>
  );
}
