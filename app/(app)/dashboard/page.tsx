import { DashboardFinancialSection } from "@/components/organisms/dashboard-financial-section";
import { DashboardRevenueBreakdownPanel } from "@/components/organisms/dashboard-revenue-breakdown-panel";
import { DashboardStudioOccupancyPanel } from "@/components/organisms/dashboard-studio-occupancy-panel";
import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import { OverdueReceivablesPanel } from "@/components/organisms/overdue-receivables-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { loadDashboardKpis, loadRevenueExpenseSeries } from "@/lib/dashboard/load-analytics";
import { loadDashboardKpiComparison } from "@/lib/dashboard/kpi-comparison";
import {
  countOverdueReceivables,
  DASHBOARD_OVERDUE_PREVIEW_LIMIT,
  getOverdueReceivablesTotal,
  loadOverdueReceivables,
} from "@/lib/dashboard/load-overdue-receivables";
import { loadRevenueByCategory } from "@/lib/dashboard/load-revenue-by-category";
import { loadStudioOccupancy } from "@/lib/dashboard/load-studio-occupancy";
import {
  parseCategoryPeriod,
  parseDashboardChartGranularity,
  parseDashboardKpiPeriod,
  parseOccupancyPeriod,
} from "@/lib/dashboard/periods";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  countPendingExpenseApprovals,
  loadPendingExpenseApprovals,
} from "@/lib/expenses/load-pending-approvals";
import { PERMISSIONS } from "@/lib/permissions";

type DashboardPageProps = {
  searchParams: Promise<{
    granularity?: string;
    kpiPeriod?: string;
    categoryPeriod?: string;
    occupancyPeriod?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FULL);
  const query = await searchParams;
  const kpiPeriod = parseDashboardKpiPeriod(query.kpiPeriod);
  const granularity = parseDashboardChartGranularity(query.granularity);
  const categoryPeriod = parseCategoryPeriod(query.categoryPeriod, kpiPeriod);
  const occupancyPeriod = parseOccupancyPeriod(query.occupancyPeriod, kpiPeriod);
  const canApproveExpenses = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  const [kpis, kpiComparison, series, revenueBreakdown, studioOccupancy, overdueReceivables, overdueCount, overdueTotal, pendingApprovals] =
    await Promise.all([
    loadDashboardKpis(kpiPeriod),
    loadDashboardKpiComparison(kpiPeriod),
    loadRevenueExpenseSeries(granularity),
    loadRevenueByCategory(categoryPeriod),
    loadStudioOccupancy(occupancyPeriod),
    loadOverdueReceivables(DASHBOARD_OVERDUE_PREVIEW_LIMIT),
    countOverdueReceivables(),
    getOverdueReceivablesTotal(),
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
        comparison={kpiComparison}
        series={series}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
        categoryPeriod={categoryPeriod}
        occupancyPeriod={occupancyPeriod}
      />

      <DashboardRevenueBreakdownPanel
        categoryPeriod={categoryPeriod}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
        occupancyPeriod={occupancyPeriod}
        points={revenueBreakdown.points}
        periodLabel={revenueBreakdown.periodLabel}
        total={revenueBreakdown.total}
      />

      <DashboardStudioOccupancyPanel
        occupancyPeriod={occupancyPeriod}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
        categoryPeriod={categoryPeriod}
        snapshot={studioOccupancy}
      />

      <OverdueReceivablesPanel
        items={overdueReceivables}
        totalOverdue={overdueCount}
        totalAmount={overdueTotal}
        showViewAllLink
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
