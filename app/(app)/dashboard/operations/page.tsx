import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function OperationsDashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_OPERATIONAL);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-primary">Vue opérationnelle</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Espace secrétariat de {session.user.name} — saisie des revenus à venir.
        </p>
      </div>
    </section>
  );
}
