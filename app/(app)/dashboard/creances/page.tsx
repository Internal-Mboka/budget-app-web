import { OverdueReceivablesPanel } from "@/components/organisms/overdue-receivables-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasAnyPermission, requireSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/currency";
import {
  getOverdueReceivablesTotal,
  loadOverdueReceivables,
} from "@/lib/dashboard/load-overdue-receivables";
import { PERMISSIONS } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function OverdueReceivablesPage() {
  const session = await requireSession();

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
    ])
  ) {
    redirect("/login?error=forbidden");
  }

  const [items, totalAmount] = await Promise.all([loadOverdueReceivables(), getOverdueReceivablesTotal()]);

  return (
    <section className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Créances en souffrance"
        description="Réservations « Réservé — acompte requis » dont la date de prestation est dépassée."
      />

      <OverdueReceivablesPanel
        items={items}
        totalOverdue={items.length}
        totalAmount={totalAmount}
        description={`${items.length} créance${items.length > 1 ? "s" : ""} à relancer — total ${formatMoney(totalAmount)}.`}
      />
    </section>
  );
}
