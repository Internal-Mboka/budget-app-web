import Link from "next/link";
import type { Session } from "next-auth";

import { PermissionGate } from "@/components/molecules/permission-gate";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { logoutAction } from "@/lib/actions/auth";
import { getDefaultDashboardPath } from "@/lib/auth/routes";
import { mbokaButtonOutlineClassName, mbokaPageClassName, ROLE_LABELS } from "@/lib/design-tokens";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  user: Session["user"];
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const roleLabel = ROLE_LABELS[user.roleName] ?? user.roleName;
  const dashboardPath = getDefaultDashboardPath(user);

  return (
    <div className={cn("min-h-screen", mbokaPageClassName)}>
      <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/80 backdrop-blur dark:border-sky-900/80 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#10579F] dark:text-sky-50">Mboka Budget</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.name} · {roleLabel}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action={logoutAction}>
                <Button type="submit" variant="outline" className={mbokaButtonOutlineClassName}>
                  Déconnexion
                </Button>
              </form>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link href={dashboardPath} className={mbokaButtonOutlineClassName}>
              Dashboard
            </Link>
            <PermissionGate permission={PERMISSIONS.USERS_MANAGE}>
              <Link href="/admin/users" className={mbokaButtonOutlineClassName}>
                Utilisateurs
              </Link>
            </PermissionGate>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
