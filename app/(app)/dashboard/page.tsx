import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardAnalyticsPanel } from "@/components/organisms/dashboard-analytics-panel";
import { ExpensePendingApprovalsPanel } from "@/components/organisms/expense-pending-approvals-panel";
import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { loadDashboardKpis, loadRevenueExpenseSeries } from "@/lib/dashboard/load-analytics";
import { parseDashboardChartGranularity } from "@/lib/dashboard/periods";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  countPendingExpenseApprovals,
  loadPendingExpenseApprovals,
} from "@/lib/expenses/load-pending-approvals";
import { PERMISSIONS } from "@/lib/permissions";

type DashboardPageProps = {
  searchParams: Promise<{ granularity?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FULL);
  const query = await searchParams;
  const granularity = parseDashboardChartGranularity(query.granularity);
  const canApproveExpenses = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  const [kpis, series, pendingApprovals] = await Promise.all([
    loadDashboardKpis(),
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

  const updatedLabel = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Vue complète"
        description={`Bienvenue ${session.user.name}. Indicateurs financiers du studio — PDG, DT et direction.`}
      />

      <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="dashboard-updated-at">
        Données calculées au {updatedLabel}
      </p>

      <MbokaKpiGrid>
        <MbokaKpiCard
          label="Chiffre d'affaires"
          value={kpis.revenueTotal}
          hint={kpis.periodLabel}
          testId="dashboard-kpi-revenue"
        />
        <MbokaKpiCard
          label="Dépenses totales"
          value={kpis.expenseTotal}
          hint={kpis.periodLabel}
          testId="dashboard-kpi-expenses"
        />
        <MbokaKpiCard
          label="Trésorerie nette"
          value={kpis.netTreasury}
          hint="Encaissements − décaissements"
          testId="dashboard-kpi-treasury"
        />
        <MbokaKpiCard
          label="Créances restant dues"
          value={kpis.receivables}
          hint="Soldes impayés clients"
          testId="dashboard-kpi-receivables"
        />
      </MbokaKpiGrid>

      <DashboardAnalyticsPanel granularity={granularity} series={series} />

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
