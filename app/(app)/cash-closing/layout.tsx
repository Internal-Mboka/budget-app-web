import { CashClosingSubNav } from "@/components/molecules/cash-closing-sub-nav";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function CashClosingLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission(PERMISSIONS.CASH_CLOSE);
  const showApprovalsNav = hasPermission(session.user.permissions, PERMISSIONS.CASH_APPROVE_CLOSING);

  return (
    <div className="space-y-6">
      <CashClosingSubNav showApprovalsNav={showApprovalsNav} />
      {children}
    </div>
  );
}
