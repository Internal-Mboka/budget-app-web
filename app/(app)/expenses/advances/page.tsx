import { ExpensesCashAdvanceManagement } from "@/components/organisms/expenses-cash-advance-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import {
  countCashAdvancesAwaitingJustification,
  countPendingCashAdvanceApprovals,
  loadCashAdvanceRequests,
} from "@/lib/expenses/load-cash-advances";
import { PERMISSIONS } from "@/lib/permissions";

type ExpensesAdvancesPageProps = {
  searchParams: Promise<{ created?: string }>;
};

export default async function ExpensesAdvancesPage({ searchParams }: ExpensesAdvancesPageProps) {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);
  const query = await searchParams;

  const [requests, pendingApprovals, awaitingJustification] = await Promise.all([
    loadCashAdvanceRequests(50),
    countPendingCashAdvanceApprovals(),
    countCashAdvancesAwaitingJustification(),
  ]);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Avances de caisse"
        description="Demandes d'avance et notes de frais avec validation avant sortie de trésorerie."
      />

      <ExpensesCashAdvanceManagement
        requests={requests}
        pendingApprovals={pendingApprovals}
        awaitingJustification={awaitingJustification}
        flashCreated={query.created === "1"}
      />
    </div>
  );
}
