import { Lock } from "lucide-react";

import { formatFiscalPeriodRange } from "@/lib/fiscal-period/format";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import { getFiscalPeriodStatusLabel } from "@/lib/fiscal-period/status";
import { cn } from "@/lib/utils";

type FiscalPeriodClosingBannerProps = {
  period: FiscalPeriodRecord;
};

export function FiscalPeriodClosingBanner({ period }: FiscalPeriodClosingBannerProps) {
  const rangeLabel = formatFiscalPeriodRange(period.startDate, period.endDate);
  const statusLabel = getFiscalPeriodStatusLabel(period.status);

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
      )}
      data-testid="fiscal-period-closing-banner"
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold">
            Trimestre {period.label} · {statusLabel}
          </p>
          <p className="text-amber-900/90 dark:text-amber-100/90">
            Période {rangeLabel}. Les saisies financières sont figées en attente de validation comptable.
          </p>
        </div>
      </div>
    </div>
  );
}
