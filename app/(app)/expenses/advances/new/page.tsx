import { ExpenseCashAdvanceCreateForm } from "@/components/organisms/expense-cash-advance-create-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ExpenseCashAdvanceNewPage() {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Nouvelle avance de caisse"
        description="Soumettez une demande avec motif et montant estimé pour validation avant décaissement."
      />

      <ExpenseCashAdvanceCreateForm />
    </div>
  );
}
