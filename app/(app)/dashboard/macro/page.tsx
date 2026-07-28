import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardMacroPanel } from "@/components/organisms/dashboard-macro-panel";
import { DashboardViewSwitcher } from "@/components/molecules/dashboard-view-switcher";
import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { getAccessibleDashboardViews } from "@/lib/auth/dashboard-views";
import { requirePermission } from "@/lib/auth/session";
import { loadMacroDashboardKpis, loadMacroRevenueTrend } from "@/lib/dashboard/load-macro-analytics";
import { parseMacroKpiPeriod } from "@/lib/dashboard/periods";
import { PERMISSIONS } from "@/lib/permissions";

type MacroDashboardPageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function MacroDashboardPage({ searchParams }: MacroDashboardPageProps) {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_MACRO);
  const query = await searchParams;
  const period = parseMacroKpiPeriod(query.period);

  const [kpis, series] = await Promise.all([loadMacroDashboardKpis(period), loadMacroRevenueTrend(period)]);
  const dashboardViews = getAccessibleDashboardViews(session.user.permissions);

  const updatedLabel = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });

  return (
    <section className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Vue macro"
        description={`Consultation synthétique pour ${session.user.name} — totaux agrégés uniquement.`}
      />

      <DashboardViewSwitcher views={dashboardViews} />

      <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="dashboard-macro-updated-at">
        Données agrégées au {updatedLabel} — aucun détail nominatif affiché.
      </p>

      <MbokaKpiGrid>
        <MbokaKpiCard
          label="Chiffre d'affaires global"
          value={kpis.revenueTotal}
          hint={kpis.periodLabel}
          testId="dashboard-macro-kpi-revenue"
        />
        <MbokaKpiCard
          label="Marge nette"
          value={kpis.netMargin}
          hint={`${kpis.periodLabel} — revenus − dépenses`}
          testId="dashboard-macro-kpi-margin"
        />
        <MbokaKpiCard
          label="Taux d'occupation studio"
          value={kpis.occupancyRate}
          hint="Heures vendues / capacité d'ouverture"
          testId="dashboard-macro-kpi-occupancy"
          format="percent"
        />
      </MbokaKpiGrid>

      <DashboardMacroPanel period={period} series={series} />
    </section>
  );
}
