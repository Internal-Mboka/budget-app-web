import { ExpenseRecurringCreateForm } from "@/components/organisms/expense-recurring-create-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ExpenseRecurringNewPage() {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Nouvelle dépense récurrente"
        description="Configurez une charge périodique avec montant estimé et fréquence de renouvellement."
      />

      <ExpenseRecurringCreateForm />
    </div>
  );
}
