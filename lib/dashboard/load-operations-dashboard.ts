import { endOfDay, format, isWithinInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { PaymentStatus, RevenueCategory } from "@prisma/client";

import { parseBookingFromMetadata } from "@/lib/revenues/booking";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

export type OperationsDashboardRecentRevenue = {
  id: string;
  code: string;
  clientName: string | null;
  revenueCategory: RevenueCategory | null;
  totalAmount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
};

export type OperationsDashboardBooking = {
  id: string;
  code: string;
  clientName: string | null;
  resourceLabel: string;
  startTime: string;
  status: PaymentStatus;
};

export type OperationsDashboardSnapshot = {
  todayLabel: string;
  todayCreatedCount: number;
  todayCreatedTotal: number;
  pendingPaymentCount: number;
  todayBookingsCount: number;
  recentRevenues: OperationsDashboardRecentRevenue[];
  todayBookings: OperationsDashboardBooking[];
};

export async function loadOperationsDashboardSnapshot(): Promise<OperationsDashboardSnapshot> {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const revenueWhere = { type: "REVENUE" as const, isAdjustment: false };

  const [todayCreated, pendingPaymentCount, recentRevenues, bookableRevenues] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        ...revenueWhere,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      select: { totalAmount: true },
    }),
    prisma.transaction.count({
      where: {
        ...revenueWhere,
        status: { notIn: ["SOLDE", "LITIGE_ANNULE"] },
      },
    }),
    prisma.transaction.findMany({
      where: revenueWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        code: true,
        revenueCategory: true,
        totalAmount: true,
        currency: true,
        status: true,
        createdAt: true,
        client: { select: { name: true } },
      },
    }),
    prisma.transaction.findMany({
      where: {
        ...revenueWhere,
        revenueCategory: { in: ["STUDIO_SESSION", "LOCATION_VEHICULE"] },
        status: { not: "LITIGE_ANNULE" },
      },
      select: {
        id: true,
        code: true,
        status: true,
        revenueCategory: true,
        metadata: true,
        client: { select: { name: true } },
      },
    }),
  ]);

  const todayBookings = bookableRevenues.flatMap((revenue) => {
    if (!revenue.revenueCategory) {
      return [];
    }

    const slot = parseBookingFromMetadata(revenue.revenueCategory, revenue.metadata);

    if (!slot) {
      return [];
    }

    const start = new Date(slot.startTime);

    if (!isWithinInterval(start, { start: dayStart, end: dayEnd })) {
      return [];
    }

    return [
      {
        id: revenue.id,
        code: revenue.code,
        clientName: revenue.client?.name ?? null,
        resourceLabel: slot.resourceLabel,
        startTime: slot.startTime,
        status: revenue.status,
      } satisfies OperationsDashboardBooking,
    ];
  });

  todayBookings.sort(
    (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
  );

  const todayCreatedTotal = todayCreated.reduce(
    (sum, revenue) => sum + decimalToNumber(revenue.totalAmount),
    0
  );

  return {
    todayLabel: format(now, "EEEE d MMMM yyyy", { locale: fr }),
    todayCreatedCount: todayCreated.length,
    todayCreatedTotal,
    pendingPaymentCount,
    todayBookingsCount: todayBookings.length,
    todayBookings,
    recentRevenues: recentRevenues.map((revenue) => ({
      id: revenue.id,
      code: revenue.code,
      clientName: revenue.client?.name ?? null,
      revenueCategory: revenue.revenueCategory,
      totalAmount: decimalToNumber(revenue.totalAmount),
      currency: revenue.currency,
      status: revenue.status,
      createdAt: revenue.createdAt.toISOString(),
    })),
  };
}
