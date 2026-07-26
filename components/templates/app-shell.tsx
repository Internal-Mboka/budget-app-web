import type { Session } from "next-auth";

import { AppSidebar } from "@/components/organisms/app-sidebar";
import { getDefaultDashboardPath } from "@/lib/auth/routes";
import { hasPermission } from "@/lib/auth/session";
import { mbokaPageClassName } from "@/lib/design-tokens";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type AppShellProps = {
  user: Session["user"];
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const dashboardPath = getDefaultDashboardPath(user);
  const canManageUsers = hasPermission(user.permissions, PERMISSIONS.USERS_MANAGE);
  const canManageClients = hasPermission(user.permissions, PERMISSIONS.FINANCE_CREATE_REVENUE);
  const canManageExpenses = hasPermission(user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE);

  return (
    <div className={cn("flex h-dvh flex-col overflow-hidden", mbokaPageClassName)}>
      <AppSidebar
        userName={user.name ?? "Utilisateur"}
        roleName={user.roleName}
        dashboardPath={dashboardPath}
        canManageUsers={canManageUsers}
        canManageClients={canManageClients}
        canManageExpenses={canManageExpenses}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:pl-72">
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
