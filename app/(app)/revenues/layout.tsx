import { RevenuesBackNav } from "@/components/molecules/revenues-back-nav";
import { RevenuesSubNav } from "@/components/molecules/revenues-sub-nav";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function RevenuesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  return (
    <div className="space-y-6">
      <RevenuesBackNav />
      <RevenuesSubNav />
      {children}
    </div>
  );
}
