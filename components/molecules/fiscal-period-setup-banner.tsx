import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { ROLES, type RoleName } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type FiscalPeriodSetupBannerProps = {
  roleName: RoleName;
};

export function FiscalPeriodSetupBanner({ roleName }: FiscalPeriodSetupBannerProps) {
  const isPdg = roleName === ROLES.PDG;

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        isPdg
          ? "border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          : "border-sky-200 bg-sky-50/90 text-[#10579F] dark:border-sky-900 dark:bg-slate-900/60 dark:text-sky-100"
      )}
      data-testid="fiscal-period-setup-banner"
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Initialiser le trimestre comptable Mboka</p>
          <p className={isPdg ? "text-amber-900/90 dark:text-amber-100/90" : "text-slate-600 dark:text-slate-300"}>
            {isPdg
              ? "Avant toute saisie financière, ouvrez le 1er trimestre (T1) et définissez éventuellement les soldes d'ouverture."
              : "Les saisies financières sont en attente. Seul le PDG peut ouvrir le 1er trimestre comptable."}
          </p>
        </div>
      </div>

      {isPdg ? (
        <Link
          href="/dashboard/setup"
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#10579F] px-4 py-2 text-sm font-medium text-white no-underline transition hover:bg-[#0d4a87]"
          data-testid="fiscal-period-setup-banner-link"
        >
          Configurer le T1
        </Link>
      ) : null}
    </div>
  );
}
