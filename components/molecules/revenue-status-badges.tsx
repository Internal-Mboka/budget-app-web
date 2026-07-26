import {
  getRevenueStatusBadges,
  revenueStatusBadgeClassName,
} from "@/lib/revenues/status";
import type { RevenueFulfillmentMetadata } from "@/lib/revenues/fulfillment";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@prisma/client";

type RevenueStatusBadgesProps = {
  financialStatus: PaymentStatus | string;
  fulfillment?: RevenueFulfillmentMetadata | null;
  className?: string;
};

export function RevenueStatusBadges({
  financialStatus,
  fulfillment,
  className,
}: RevenueStatusBadgesProps) {
  const badges = getRevenueStatusBadges(financialStatus, fulfillment);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          data-testid={`revenue-status-badge-${badge.key}`}
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            revenueStatusBadgeClassName(badge)
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
