import { DashboardFinancialSection } from "@/components/organisms/dashboard-financial-section";
import { DashboardRevenueBreakdownPanel } from "@/components/organisms/dashboard-revenue-breakdown-panel";
import { DashboardStudioOccupancyPanel } from "@/components/organisms/dashboard-studio-occupancy-panel";
import { DashboardTreasuryProjectionPanel } from "@/components/organisms/dashboard-treasury-projection-panel";
import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import { OverdueReceivablesPanel } from "@/components/organisms/overdue-receivables-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { enrichRevenueExpenseSeriesWithComparison } from "@/lib/dashboard/enrich-series-comparison";
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
import { loadTreasuryProjection } from "@/lib/dashboard/load-treasury-projection";
import {
  parseCategoryPeriod,
  parseDashboardChartGranularity,
  parseDashboardKpiPeriod,
  parseOccupancyPeriod,
  parseProjectionPeriod,
} from "@/lib/dashboard/periods";
import { parseProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";
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
    projectionPeriod?: string;
    projectionScenario?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FULL);
  const query = await searchParams;
  const kpiPeriod = parseDashboardKpiPeriod(query.kpiPeriod);
  const granularity = parseDashboardChartGranularity(query.granularity);
  const categoryPeriod = parseCategoryPeriod(query.categoryPeriod, kpiPeriod);
  const occupancyPeriod = parseOccupancyPeriod(query.occupancyPeriod, kpiPeriod);
  const projectionPeriod = parseProjectionPeriod(query.projectionPeriod, kpiPeriod);
  const projectionScenario = parseProjectionScenario(query.projectionScenario);
  const canApproveExpenses = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  const [kpis, kpiComparison, rawSeries, revenueBreakdown, studioOccupancy, treasuryProjection, overdueReceivables, overdueCount, overdueTotal, pendingApprovals] =
    await Promise.all([
    loadDashboardKpis(kpiPeriod),
    loadDashboardKpiComparison(kpiPeriod),
    loadRevenueExpenseSeries(granularity),
    loadRevenueByCategory(categoryPeriod),
    loadStudioOccupancy(occupancyPeriod),
    loadTreasuryProjection(projectionPeriod, projectionScenario),
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

  const series = enrichRevenueExpenseSeriesWithComparison(rawSeries);

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
        projectionPeriod={projectionPeriod}
        projectionScenario={projectionScenario}
      />

      <DashboardRevenueBreakdownPanel
        categoryPeriod={categoryPeriod}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
        occupancyPeriod={occupancyPeriod}
        projectionPeriod={projectionPeriod}
        projectionScenario={projectionScenario}
        points={revenueBreakdown.points}
        periodLabel={revenueBreakdown.periodLabel}
        total={revenueBreakdown.total}
        totalPercentChange={revenueBreakdown.totalPercentChange}
        comparisonLabel={revenueBreakdown.comparisonLabel}
      />

      <DashboardStudioOccupancyPanel
        occupancyPeriod={occupancyPeriod}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
        categoryPeriod={categoryPeriod}
        projectionPeriod={projectionPeriod}
        projectionScenario={projectionScenario}
        snapshot={studioOccupancy}
      />

      <DashboardTreasuryProjectionPanel
        basePath="/dashboard"
        projectionPeriod={projectionPeriod}
        projectionScenario={projectionScenario}
        kpiPeriod={kpiPeriod}
        granularity={granularity}
        categoryPeriod={categoryPeriod}
        occupancyPeriod={occupancyPeriod}
        snapshot={treasuryProjection}
        audienceLabel="PDG et Directeur Technique"
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
