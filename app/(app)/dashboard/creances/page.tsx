import Link from "next/link";

import { OverdueReceivablesPanel } from "@/components/organisms/overdue-receivables-panel";
import { OverdueReceivablesSummaryGrid } from "@/components/organisms/overdue-receivables-summary-grid";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasAnyPermission, requireSession } from "@/lib/auth/session";
import {
  loadOverdueReceivables,
  summarizeOverdueReceivables,
} from "@/lib/dashboard/load-overdue-receivables";
import { PERMISSIONS } from "@/lib/permissions";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
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

  const items = await loadOverdueReceivables();
  const summary = summarizeOverdueReceivables(items);

  return (
    <section className="space-y-8">
      <MbokaPageHeader
        eyebrow="Dashboard"
        title="Créances en souffrance"
        description="Réservations « Réservé — acompte requis » dont la date de prestation est dépassée."
      />

      <OverdueReceivablesSummaryGrid summary={summary} />

      <OverdueReceivablesPanel
        items={items}
        totalOverdue={summary.count}
        totalAmount={summary.totalAmount}
        layout="table"
        showReminderInfo
        title="Liste complète"
        description={`${summary.count} créance${summary.count > 1 ? "s" : ""} triée${summary.count > 1 ? "s" : ""} par montant dû puis ancienneté.`}
      />

      <section className={cn(mbokaPanelClassName, "p-5 sm:p-6")}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Besoin du registre complet des revenus ?{" "}
          <Link href="/revenues" className="font-medium text-[#10579F] hover:underline dark:text-sky-300">
            Ouvrir le registre des revenus →
          </Link>
        </p>
      </section>
    </section>
  );
}
