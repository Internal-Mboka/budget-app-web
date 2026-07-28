import { UserRound } from "lucide-react";

import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CashClosingOperator = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

type CashClosingOperatorCardProps = {
  operator: CashClosingOperator;
  emphasized?: boolean;
  subtitle?: string;
  className?: string;
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function CashClosingOperatorCard({
  operator,
  emphasized = false,
  subtitle = "Opérateur responsable de cette clôture",
  className,
}: CashClosingOperatorCardProps) {
  const fullName = `${operator.firstName} ${operator.lastName}`;

  return (
    <section
      className={cn(
        mbokaPanelClassName,
        "flex items-center gap-4 p-4 sm:p-5",
        emphasized && "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
        className
      )}
      data-testid="cash-closing-operator-card"
    >
      {operator.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={operator.avatarUrl}
          alt={fullName}
          className={cn(
            "rounded-full object-cover",
            emphasized ? "size-14 ring-2 ring-amber-300 dark:ring-amber-700" : "size-12"
          )}
          data-testid="cash-closing-operator-avatar"
        />
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-[#10579F] font-semibold text-white",
            emphasized ? "size-14 text-base ring-2 ring-amber-300 dark:ring-amber-700" : "size-12 text-sm"
          )}
          data-testid="cash-closing-operator-avatar-fallback"
        >
          {getInitials(operator.firstName, operator.lastName)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <UserRound className={cn("size-4 shrink-0", emphasized ? "text-amber-700 dark:text-amber-300" : "text-sky-600")} />
          <p className={mbokaLabelClassName}>Opérateur de clôture</p>
        </div>
        <p
          className="mt-1 truncate text-sm font-semibold text-[#10579F] dark:text-sky-50"
          data-testid="cash-closing-operator-name"
        >
          {fullName}
        </p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}
