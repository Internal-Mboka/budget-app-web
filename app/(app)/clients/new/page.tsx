import { ClientCreateForm } from "@/components/organisms/client-create-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function NewClientPage() {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Tiers & clients"
        title="Nouveau client"
        description="Enregistrez un client avec son nom et sa catégorie. Les contacts sont optionnels."
      />

      <ClientCreateForm />
    </div>
  );
}
