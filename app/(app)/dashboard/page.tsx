import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function DashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_FULL);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-primary">Vue complète</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bienvenue {session.user.name}. Pilotage macro et micro — modules métier à venir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Chiffre d'affaires", value: "—" },
          { label: "Dépenses", value: "—" },
          { label: "Trésorerie nette", value: "—" },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-sm dark:border-sky-900 dark:bg-slate-900/70"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-primary">{metric.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
