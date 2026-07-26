import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function FinancialDashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FINANCIAL);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-primary">Vue financière</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Espace comptable de {session.user.name} — registre, caisse et exports à venir.
        </p>
      </div>
    </section>
  );
}
