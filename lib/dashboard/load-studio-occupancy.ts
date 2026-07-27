import type { DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { countDaysInclusive, getKpiComparisonLabel, getKpiPeriodRange, getPreviousKpiPeriodRange } from "@/lib/dashboard/periods";
import { computePercentChange } from "@/lib/dashboard/percent-change";
import {
  STUDIO_OPENING_HOURS_PER_DAY,
  estimateStudioCapacityHours,
} from "@/lib/dashboard/studio-capacity";
import { prisma } from "@/lib/prisma";
import { STUDIO_ROOM_OPTIONS } from "@/lib/revenues/categories";
import { roundMoney } from "@/lib/transactions/decimal";

export type StudioRoomOccupancyPoint = {
  room: string;
  label: string;
  soldHours: number;
  capacityHours: number;
  occupancyRate: number;
};

export type StudioOccupancySnapshot = {
  soldHours: number;
  capacityHours: number;
  occupancyRate: number;
  periodLabel: string;
  rooms: StudioRoomOccupancyPoint[];
  occupancyPercentChange: number | null;
  comparisonLabel: string;
};

function extractDurationHours(metadata: unknown): number {
  if (!metadata || typeof metadata !== "object") {
    return 0;
  }

  const value = (metadata as Record<string, unknown>).durationHours;
  const hours = Number(value);

  return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

function extractStudioRoom(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const room = (metadata as Record<string, unknown>).studioRoom;

  return typeof room === "string" && room.trim().length > 0 ? room.trim() : null;
}

function computeOccupancyRate(soldHours: number, capacityHours: number): number {
  if (capacityHours <= 0) {
    return 0;
  }

  return roundMoney(Math.min(100, (soldHours / capacityHours) * 100));
}

export async function loadStudioOccupancy(
  period: DashboardKpiPeriod = "month",
  reference = new Date()
): Promise<StudioOccupancySnapshot> {
  const currentRange = getKpiPeriodRange(period, reference);
  const previousRange = getPreviousKpiPeriodRange(period, reference);
  const comparisonLabel = getKpiComparisonLabel(period);

  const [current, previousRate] = await Promise.all([
    loadStudioOccupancyForRange(currentRange.from, currentRange.to, currentRange.label),
    loadStudioOccupancyForRange(previousRange.from, previousRange.to, previousRange.label).then(
      (snapshot) => snapshot.occupancyRate
    ),
  ]);

  return {
    ...current,
    occupancyPercentChange: computePercentChange(current.occupancyRate, previousRate),
    comparisonLabel,
  };
}

async function loadStudioOccupancyForRange(from: Date, to: Date, label: string) {
  const daysInPeriod = countDaysInclusive(from, to);
  const capacityPerRoom = roundMoney(daysInPeriod * STUDIO_OPENING_HOURS_PER_DAY);
  const totalCapacity = estimateStudioCapacityHours(daysInPeriod);

  const soldByRoom = new Map<string, number>();

  for (const option of STUDIO_ROOM_OPTIONS) {
    soldByRoom.set(option.value, 0);
  }

  const rows = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      revenueCategory: "STUDIO_SESSION",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      createdAt: { gte: from, lte: to },
    },
    select: { metadata: true },
  });

  for (const row of rows) {
    const hours = extractDurationHours(row.metadata);
    const room = extractStudioRoom(row.metadata);

    if (hours <= 0 || !room) {
      continue;
    }

    soldByRoom.set(room, roundMoney((soldByRoom.get(room) ?? 0) + hours));
  }

  const rooms: StudioRoomOccupancyPoint[] = STUDIO_ROOM_OPTIONS.map(({ value, label: roomLabel }) => {
    const soldHours = soldByRoom.get(value) ?? 0;

    return {
      room: value,
      label: roomLabel,
      soldHours,
      capacityHours: capacityPerRoom,
      occupancyRate: computeOccupancyRate(soldHours, capacityPerRoom),
    };
  });

  rooms.sort((left, right) => right.occupancyRate - left.occupancyRate);

  const soldHours = roundMoney([...soldByRoom.values()].reduce((sum, hours) => sum + hours, 0));

  return {
    soldHours,
    capacityHours: totalCapacity,
    occupancyRate: computeOccupancyRate(soldHours, totalCapacity),
    periodLabel: label,
    rooms,
    occupancyPercentChange: null,
    comparisonLabel: "",
  };
}
