import { DashboardOperationsPanel } from "@/components/organisms/dashboard-operations-panel";
import { DashboardUpdatedAt } from "@/components/molecules/dashboard-updated-at";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { loadOperationsDashboardSnapshot } from "@/lib/dashboard/load-operations-dashboard";
import { PERMISSIONS } from "@/lib/permissions";

export default async function OperationsDashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_OPERATIONAL);
  const snapshot = await loadOperationsDashboardSnapshot();

  return (
    <section className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Vue opérationnelle"
        description={`Espace secrétariat de ${session.user.name} — saisie des revenus, clients et réservations du jour.`}
        descriptionAside={<DashboardUpdatedAt />}
      />

      <DashboardOperationsPanel snapshot={snapshot} />
    </section>
  );
}
