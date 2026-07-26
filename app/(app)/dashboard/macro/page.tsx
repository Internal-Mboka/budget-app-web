import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function MacroDashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_MACRO);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-primary">Vue macro</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Consultation synthétique pour {session.user.name} — indicateurs condensés à venir.
        </p>
      </div>
    </section>
  );
}
