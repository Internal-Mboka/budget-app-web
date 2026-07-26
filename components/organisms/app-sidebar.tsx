"use client";

import {
  Fingerprint,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorSmartphone,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/atoms/logo";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { logoutAction } from "@/lib/actions/auth";
import { mbokaButtonOutlineClassName, ROLE_LABELS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type AppSidebarProps = {
  userName: string;
  roleName: string;
  dashboardPath: string;
  canManageUsers: boolean;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar({
  userName,
  roleName,
  dashboardPath,
  canManageUsers,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel = ROLE_LABELS[roleName] ?? roleName;

  const navItems: NavItem[] = [
    { href: dashboardPath, label: "Dashboard", icon: LayoutDashboard },
    { href: "/account/password", label: "Mot de passe", icon: KeyRound },
    { href: "/account/sessions", label: "Sessions", icon: MonitorSmartphone },
    { href: "/account/two-factor", label: "2FA", icon: Fingerprint },
  ];

  if (canManageUsers) {
    navItems.push({ href: "/admin/users", label: "Utilisateurs", icon: Users });
    navItems.push({ href: "/admin/roles", label: "Permissions", icon: ShieldCheck });
  }

  function isActive(href: string) {
    if (href === dashboardPath) {
      return pathname === href || pathname.startsWith("/dashboard");
    }

    if (href === "/account/password") {
      return pathname === href;
    }

    if (href === "/account/sessions") {
      return pathname === href;
    }

    if (href === "/account/two-factor") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="contents">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-sky-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden dark:border-sky-900 dark:bg-slate-900/90">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-sky-100 p-2 text-[#10579F] dark:border-sky-900 dark:text-sky-50"
        >
          <Menu className="size-5" />
        </button>
        <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Mboka Budget</p>
        <ThemeToggle />
      </header>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-72 flex-col border-r border-sky-100 bg-white/95 backdrop-blur transition-transform dark:border-sky-900 dark:bg-slate-950/95",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 rounded-lg p-1 text-slate-500 lg:hidden"
        >
          <X className="size-5" />
        </button>

        <div className="border-b border-sky-100 px-5 py-6 dark:border-sky-900">
          <div className="flex items-center gap-3">
            <Logo variant="badge" size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#10579F] dark:text-sky-50">Mboka Budget</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">Studio Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={
                item.href === "/admin/users"
                  ? "nav-utilisateurs"
                  : item.href === "/admin/roles"
                    ? "nav-permissions"
                    : item.href === "/account/sessions"
                      ? "nav-sessions"
                      : item.href === "/account/two-factor"
                        ? "nav-two-factor"
                        : undefined
              }
              onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-sky-50 text-[#10579F] ring-1 ring-sky-100 dark:bg-slate-800 dark:text-sky-50 dark:ring-sky-900"
                    : "text-slate-600 hover:bg-sky-50/70 hover:text-[#10579F] dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-sky-50"
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-[#10579F] dark:text-sky-400" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sky-100 p-4 dark:border-sky-900">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-sky-50/80 px-3 py-3 dark:bg-slate-800/80">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#10579F] text-xs font-semibold text-white">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#10579F] dark:text-sky-50">{userName}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
            <ThemeToggle />
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              data-testid="app-logout"
              className={cn(
                mbokaButtonOutlineClassName,
                "w-full justify-start border-transparent bg-transparent px-3 text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
              )}
            >
              <LogOut className="size-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
