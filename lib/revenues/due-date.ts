import type { RevenueCategory } from "@prisma/client";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

import { parseBookingFromMetadata } from "@/lib/revenues/booking";

export function getRevenueDueDate(
  revenueCategory: RevenueCategory | null,
  metadata: unknown,
  createdAt: Date
): Date {
  if (revenueCategory) {
    const booking = parseBookingFromMetadata(revenueCategory, metadata);

    if (booking?.startTime) {
      return parseISO(booking.startTime);
    }
  }

  return createdAt;
}

export function getDaysOverdue(dueDate: Date, reference = new Date()): number {
  const days = differenceInCalendarDays(startOfDay(reference), startOfDay(dueDate));

  return Math.max(days, 0);
}

export function isRevenueOverdue(
  status: string,
  dueDate: Date,
  reference = new Date()
): boolean {
  if (status !== "RESERVE_ACOMPTE_REQUIS") {
    return false;
  }

  return startOfDay(dueDate) < startOfDay(reference);
}

export function formatDueLabel(dueDate: Date): string {
  return dueDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
