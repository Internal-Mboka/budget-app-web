import { ExpensesBackNav } from "@/components/molecules/expenses-back-nav";
import { ExpensesSubNav } from "@/components/molecules/expenses-sub-nav";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function ExpensesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);

  return (
    <div className="space-y-6">
      <ExpensesBackNav />
      <ExpensesSubNav />
      {children}
    </div>
  );
}
