import { RevenueCreateForm } from "@/components/organisms/revenue-create-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function NewRevenuePage() {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Nouveau revenu"
        description="Sélectionnez la catégorie, le client et les métadonnées spécifiques à la prestation."
      />

      <RevenueCreateForm />
    </div>
  );
}
