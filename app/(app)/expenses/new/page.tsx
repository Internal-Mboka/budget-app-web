import type { ExpenseCategory } from "@prisma/client";

import { ExpenseCreateForm } from "@/components/organisms/expense-create-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

type NewExpensePageProps = {
  searchParams: Promise<{ category?: string }>;
};

const STAFF_CATEGORY: ExpenseCategory = "PAIES_CACHETS_STAFF";

export default async function NewExpensePage({ searchParams }: NewExpensePageProps) {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);
  const query = await searchParams;
  const defaultCategory = query.category === STAFF_CATEGORY ? STAFF_CATEGORY : undefined;

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title={defaultCategory === STAFF_CATEGORY ? "Nouvelle paie / cachet" : "Nouvelle dépense"}
        description={
          defaultCategory === STAFF_CATEGORY
            ? "Enregistrez un salaire ou un cachet pour un intervenant du staff."
            : "Enregistrez une sortie d'argent avec catégorie, libellé et mode de paiement."
        }
      />

      <ExpenseCreateForm defaultCategory={defaultCategory} />
    </div>
  );
}
