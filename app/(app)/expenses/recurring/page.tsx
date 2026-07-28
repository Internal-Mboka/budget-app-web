import { ExpensesRecurringManagement } from "@/components/organisms/expenses-recurring-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { ensureRecurringExpenseDuesSynced } from "@/lib/actions/recurring-expenses";
import { loadPendingRecurringDues } from "@/lib/expenses/load-recurring-dues";
import { loadRecurringExpenseTemplates } from "@/lib/expenses/load-recurring-templates";
import { PERMISSIONS } from "@/lib/permissions";

type ExpensesRecurringPageProps = {
  searchParams: Promise<{ created?: string }>;
};

export default async function ExpensesRecurringPage({ searchParams }: ExpensesRecurringPageProps) {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);
  const query = await searchParams;

  await ensureRecurringExpenseDuesSynced();

  const [templates, dues] = await Promise.all([
    loadRecurringExpenseTemplates(),
    loadPendingRecurringDues(50),
  ]);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Dépenses récurrentes"
        description="Modèles périodiques et échéances pré-générées (loyer, abonnements, charges fixes)."
      />

      <ExpensesRecurringManagement templates={templates} dues={dues} flashCreated={query.created === "1"} />
    </div>
  );
}
