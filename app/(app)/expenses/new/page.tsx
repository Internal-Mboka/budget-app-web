import { ExpenseCreateForm } from "@/components/organisms/expense-create-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function NewExpensePage() {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Nouvelle dépense"
        description="Enregistrez une sortie d'argent avec catégorie, libellé et mode de paiement."
      />

      <ExpenseCreateForm />
    </div>
  );
}
