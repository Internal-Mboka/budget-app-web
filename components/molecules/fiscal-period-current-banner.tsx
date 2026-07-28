import { CalendarRange } from "lucide-react";

import {
  formatFiscalPeriodCompactRange,
} from "@/lib/fiscal-period/format";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import { getFiscalPeriodStatusLabel } from "@/lib/fiscal-period/status";
import { cn } from "@/lib/utils";

type FiscalPeriodCurrentBannerProps = {
  period: FiscalPeriodRecord;
  className?: string;
};

export function FiscalPeriodCurrentBanner({ period, className }: FiscalPeriodCurrentBannerProps) {
  const rangeLabel = formatFiscalPeriodCompactRange(period.startDate, period.endDate);
  const statusLabel = getFiscalPeriodStatusLabel(period.status);

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-[#10579F] dark:border-sky-900 dark:bg-slate-900/60 dark:text-sky-100",
        className
      )}
      data-testid="fiscal-period-current-banner"
      role="status"
    >
      <CalendarRange className="mt-0.5 size-4 shrink-0" />
      <p>
        Trimestre comptable :{" "}
        <span className="font-semibold">
          {period.label} ({rangeLabel}) · {statusLabel}
        </span>
      </p>
    </div>
  );
}
