import type { Session } from "next-auth";

import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  user: Session["user"];
  children: React.ReactNode;
};

const ROLE_LABELS: Record<string, string> = {
  PDG: "PDG",
  DIRECTEUR_TECHNIQUE: "Directeur Technique",
  COMPTABLE: "Comptable",
  SECRETAIRE: "Secrétaire",
  OBSERVATEUR: "Observateur",
};

export function AppShell({ user, children }: AppShellProps) {
  const roleLabel = ROLE_LABELS[user.roleName] ?? user.roleName;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_48%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#0a1628_0%,#0f1d32_48%,#0a1628_100%)]">
      <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/80 backdrop-blur dark:border-sky-900/80 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">Mboka Budget</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.name} · {roleLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Déconnexion
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
