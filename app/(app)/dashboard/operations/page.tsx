import { DashboardOperationsPanel } from "@/components/organisms/dashboard-operations-panel";
import { DashboardViewSwitcher } from "@/components/molecules/dashboard-view-switcher";
import { DashboardUpdatedAt } from "@/components/molecules/dashboard-updated-at";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { getAccessibleDashboardViews } from "@/lib/auth/dashboard-views";
import { requirePermission } from "@/lib/auth/session";
import { loadOperationsDashboardSnapshot } from "@/lib/dashboard/load-operations-dashboard";
import { PERMISSIONS } from "@/lib/permissions";

export default async function OperationsDashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_OPERATIONAL);
  const snapshot = await loadOperationsDashboardSnapshot();
  const dashboardViews = getAccessibleDashboardViews(session.user.permissions);

  return (
    <section className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Vue opérationnelle"
        description={`Espace secrétariat de ${session.user.name} — saisie des revenus, clients et réservations du jour.`}
        descriptionAside={<DashboardUpdatedAt />}
      />

      <DashboardViewSwitcher views={dashboardViews} />

      <DashboardOperationsPanel snapshot={snapshot} />
    </section>
  );
}
