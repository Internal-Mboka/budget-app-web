"use client";

import {
  Fingerprint,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorSmartphone,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
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
  testId?: string;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

type AppSidebarProps = {
  userName: string;
  roleName: string;
  dashboardPath: string;
  canManageUsers: boolean;
  canManageClients: boolean;
  canManageExpenses: boolean;
  canCloseCash: boolean;
  canViewAudit: boolean;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isNavItemActive(pathname: string, href: string, dashboardPath: string): boolean {
  if (href === dashboardPath) {
    return pathname === href || pathname.startsWith("/dashboard");
  }

  if (href === "/clients") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href === "/revenues") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href === "/expenses") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href === "/cash-closing") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href === "/audit") {
    return pathname === href || pathname.startsWith(`${href}/`);
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

export function AppSidebar({
  userName,
  roleName,
  dashboardPath,
  canManageUsers,
  canManageClients,
  canManageExpenses,
  canCloseCash,
  canViewAudit,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel = ROLE_LABELS[roleName] ?? roleName;

  const navSections: NavSection[] = [
    {
      items: [{ href: dashboardPath, label: "Dashboard", icon: LayoutDashboard }],
    },
    ...(canManageClients || canManageExpenses || canCloseCash
      ? [
          {
            title: "Opérations",
            items: [
              ...(canManageClients
                ? [
                    { href: "/clients", label: "Clients", icon: UsersRound, testId: "nav-clients" },
                    { href: "/revenues", label: "Revenus", icon: Receipt, testId: "nav-revenues" },
                  ]
                : []),
              ...(canManageExpenses
                ? [{ href: "/expenses", label: "Dépenses", icon: Wallet, testId: "nav-expenses" }]
                : []),
              ...(canCloseCash
                ? [
                    {
                      href: "/cash-closing",
                      label: "Clôture caisse",
                      icon: Landmark,
                      testId: "nav-cash-closing",
                    },
                  ]
                : []),
            ],
          } satisfies NavSection,
        ]
      : []),
    {
      title: "Mon compte",
      items: [
        { href: "/account/password", label: "Mot de passe", icon: KeyRound },
        { href: "/account/sessions", label: "Sessions", icon: MonitorSmartphone, testId: "nav-sessions" },
        { href: "/account/two-factor", label: "2FA", icon: Fingerprint, testId: "nav-two-factor" },
      ],
    },
    ...(canManageUsers || canViewAudit
      ? [
          {
            title: "Administration",
            items: [
              ...(canManageUsers
                ? [
                    { href: "/admin/users", label: "Utilisateurs", icon: Users, testId: "nav-utilisateurs" },
                    {
                      href: "/admin/roles",
                      label: "Permissions",
                      icon: ShieldCheck,
                      testId: "nav-permissions",
                    },
                  ]
                : []),
              ...(canViewAudit
                ? [{ href: "/audit", label: "Journaux d'audit", icon: ScrollText, testId: "nav-audit" }]
                : []),
            ],
          } satisfies NavSection,
        ]
      : []),
  ];

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

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title ?? `section-${sectionIndex}`} className="space-y-1">
              {section.title ? (
                <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                  {section.title}
                </p>
              ) : null}

              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item.href, dashboardPath);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={item.testId}
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
            </div>
          ))}
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
