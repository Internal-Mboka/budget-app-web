import { ExpensesBackNav } from "@/components/molecules/expenses-back-nav";
import { ExpensesSubNav } from "@/components/molecules/expenses-sub-nav";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ExpensesLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);
  const showApprovalsNav = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);

  return (
    <div className="space-y-6">
      <ExpensesBackNav />
      <ExpensesSubNav showApprovalsNav={showApprovalsNav} />
      {children}
    </div>
  );
}
