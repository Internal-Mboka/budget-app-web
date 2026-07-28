import type { Session } from "next-auth";

import { AppSidebar } from "@/components/organisms/app-sidebar";
import { AppKeyboardShortcuts } from "@/components/molecules/app-keyboard-shortcuts";
import { canManageAlertSettings } from "@/lib/alerts/access";
import { getAccessibleDashboardViews } from "@/lib/auth/dashboard-views";
import { canAccessFinancialExports } from "@/lib/exports/access";
import { getDefaultDashboardPath } from "@/lib/auth/routes";
import { hasPermission } from "@/lib/auth/session";
import { mbokaPageClassName } from "@/lib/design-tokens";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type AppShellProps = {
  user: Session["user"];
  children: React.ReactNode;
  showFiscalPeriodSetupNav?: boolean;
  showFiscalPeriodClosingNav?: boolean;
};

export function AppShell({
  user,
  children,
  showFiscalPeriodSetupNav = false,
  showFiscalPeriodClosingNav = false,
}: AppShellProps) {
  const dashboardPath = getDefaultDashboardPath(user);
  const dashboardViews = getAccessibleDashboardViews(user.permissions);
  const canManageUsers = hasPermission(user.permissions, PERMISSIONS.USERS_MANAGE);
  const canManageAlerts = canManageAlertSettings(user.roleName);
  const canManageClients = hasPermission(user.permissions, PERMISSIONS.FINANCE_CREATE_REVENUE);
  const canManageExpenses = hasPermission(user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE);
  const canCloseCash = hasPermission(user.permissions, PERMISSIONS.CASH_CLOSE);
  const canViewAudit = hasPermission(user.permissions, PERMISSIONS.AUDIT_VIEW);
  const canExportFinancial = canAccessFinancialExports({
    roleName: user.roleName,
    permissions: user.permissions,
  });

  return (
    <div className={cn("flex h-dvh flex-col overflow-hidden", mbokaPageClassName)}>
      <AppKeyboardShortcuts
        canCreateRevenue={canManageClients}
        canCreateExpense={canManageExpenses}
      />
      <AppSidebar
        userName={user.name ?? "Utilisateur"}
        roleName={user.roleName}
        permissions={user.permissions}
        dashboardPath={dashboardPath}
        dashboardViews={dashboardViews}
        canManageUsers={canManageUsers}
        canManageAlerts={canManageAlerts}
        canManageClients={canManageClients}
        canManageExpenses={canManageExpenses}
        canCloseCash={canCloseCash}
        canViewAudit={canViewAudit}
        canExportFinancial={canExportFinancial}
        showFiscalPeriodSetupNav={showFiscalPeriodSetupNav}
        showFiscalPeriodClosingNav={showFiscalPeriodClosingNav}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:pl-72">
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
