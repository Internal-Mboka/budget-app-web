import { format, startOfMonth } from "date-fns";

import { FiscalPeriodSetupPanel } from "@/components/organisms/fiscal-period-setup-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requireSession } from "@/lib/auth/session";
import { requiresFiscalPeriodSetup } from "@/lib/fiscal-period/load-fiscal-periods";
import { ROLES } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function FiscalPeriodSetupPage() {
  const session = await requireSession();

  if (session.user.roleName !== ROLES.PDG) {
    redirect("/dashboard?error=forbidden");
  }

  if (!(await requiresFiscalPeriodSetup())) {
    redirect("/dashboard");
  }

  const defaultStartDate = format(startOfMonth(new Date()), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Trimestre comptable"
        title="Initialiser le 1er trimestre"
        description="Configurez la période Mboka T1 et, si besoin, les soldes d'ouverture par canal de trésorerie."
      />

      <FiscalPeriodSetupPanel defaultStartDate={defaultStartDate} />
    </div>
  );
}
