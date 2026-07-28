import { DashboardFinancialSection } from "@/components/organisms/dashboard-financial-section";
import { DashboardRevenueBreakdownPanel } from "@/components/organisms/dashboard-revenue-breakdown-panel";
import { DashboardStudioOccupancyPanel } from "@/components/organisms/dashboard-studio-occupancy-panel";
import { DashboardTreasuryProjectionPanel } from "@/components/organisms/dashboard-treasury-projection-panel";
import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import { OverdueReceivablesPanel } from "@/components/organisms/overdue-receivables-panel";
import { DashboardOfflineSnapshotBridge } from "@/components/molecules/dashboard-offline-snapshot-bridge";
import { DashboardUpdatedAt } from "@/components/molecules/dashboard-updated-at";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { FiscalPeriodInitializedBanner } from "@/components/molecules/fiscal-period-init-notice";
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
import { parseDashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import { parseDashboardKpiScope } from "@/lib/dashboard/kpi-scope";
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
import { loadActiveFiscalPeriod } from "@/lib/fiscal-period/load-fiscal-periods";

type DashboardPageProps = {
  searchParams: Promise<{
    granularity?: string;
    kpiPeriod?: string;
    categoryPeriod?: string;
    occupancyPeriod?: string;
    projectionPeriod?: string;
    projectionScenario?: string;
    kpiScope?: string;
    accountingMode?: string;
    fiscalPeriodInitialized?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FULL);
  const query = await searchParams;
  const kpiPeriod = parseDashboardKpiPeriod(query.kpiPeriod);
  const kpiScope = parseDashboardKpiScope(query.kpiScope);
  const accountingMode = parseDashboardAccountingMode(query.accountingMode);
  const granularity = parseDashboardChartGranularity(query.granularity);
  const categoryPeriod = parseCategoryPeriod(query.categoryPeriod, kpiPeriod);
  const occupancyPeriod = parseOccupancyPeriod(query.occupancyPeriod, kpiPeriod);
  const projectionPeriod = parseProjectionPeriod(query.projectionPeriod, kpiPeriod);
  const projectionScenario = parseProjectionScenario(query.projectionScenario);
  const canApproveExpenses = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  const [kpis, kpiComparison, rawSeries, revenueBreakdown, studioOccupancy, treasuryProjection, overdueReceivables, overdueCount, overdueTotal, pendingApprovals, activeFiscalPeriod] =
    await Promise.all([
    loadDashboardKpis(kpiPeriod, undefined, kpiScope, accountingMode),
    loadDashboardKpiComparison(kpiPeriod, undefined, accountingMode),
    loadRevenueExpenseSeries(granularity, undefined, accountingMode),
    loadRevenueByCategory(categoryPeriod, undefined, accountingMode),
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
    loadActiveFiscalPeriod(),
  ]);

  const series = enrichRevenueExpenseSeriesWithComparison(rawSeries);

  return (
    <div className="space-y-8">
      {query.fiscalPeriodInitialized === "1" ? <FiscalPeriodInitializedBanner /> : null}

      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Vue complète"
        description={`Bienvenue ${session.user.name}. Pilotage financier du studio — PDG et DT.`}
        descriptionAside={<DashboardUpdatedAt />}
      />

      <DashboardOfflineSnapshotBridge
        path="/dashboard"
        periodLabel={kpis.periodLabel}
        kpis={{
          revenueTotal: kpis.revenueTotal,
          expenseTotal: kpis.expenseTotal,
          netTreasury: kpis.netTreasury,
          receivables: kpis.receivables,
          cashCollections: kpis.cashCollections,
        }}
        overdueCount={overdueCount}
        fiscalPeriodLabel={activeFiscalPeriod?.label ?? null}
      />

      <DashboardFinancialSection
        basePath="/dashboard"
        kpis={kpis}
        comparison={kpiComparison}
        series={series}
        kpiPeriod={kpiPeriod}
        kpiScope={kpiScope}
        accountingMode={accountingMode}
        granularity={granularity}
        categoryPeriod={categoryPeriod}
        occupancyPeriod={occupancyPeriod}
        projectionPeriod={projectionPeriod}
        projectionScenario={projectionScenario}
        activeFiscalPeriod={activeFiscalPeriod}
      />

      <DashboardRevenueBreakdownPanel
        categoryPeriod={categoryPeriod}
        kpiPeriod={kpiPeriod}
        kpiScope={kpiScope}
        accountingMode={accountingMode}
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
        kpiScope={kpiScope}
        accountingMode={accountingMode}
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
        kpiScope={kpiScope}
        accountingMode={accountingMode}
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
