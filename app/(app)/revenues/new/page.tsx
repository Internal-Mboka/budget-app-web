import { format } from "date-fns";

import { RevenueCreateForm } from "@/components/organisms/revenue-create-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function NewRevenuePage() {
  const session = await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);
  const canApplyDiscount = hasPermission(session.user.permissions, PERMISSIONS.DASHBOARD_FULL);
  const defaultSessionDate = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Nouveau revenu"
        description="Sélectionnez la catégorie, le client et les métadonnées spécifiques à la prestation."
      />

      <RevenueCreateForm canApplyDiscount={canApplyDiscount} defaultSessionDate={defaultSessionDate} />
    </div>
  );
}
