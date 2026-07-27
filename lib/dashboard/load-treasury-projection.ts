import {
  addDays,
  addMonths,
  addWeeks,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { loadCurrentNetTreasury } from "@/lib/dashboard/load-analytics";
import type { DashboardKpiPeriod } from "@/lib/dashboard/periods";
import {
  formatProjectionBucketLabel,
  getProjectionHorizonRange,
} from "@/lib/dashboard/periods";
import { prisma } from "@/lib/prisma";
import { getRevenueDueDate } from "@/lib/revenues/due-date";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type TreasuryProjectionPoint = {
  key: string;
  label: string;
  expectedCollections: number;
  cumulativeCollections: number;
  projectedTreasury: number;
  reservationCount: number;
};

export type TreasuryProjectionSnapshot = {
  currentNetTreasury: number;
  totalExpectedCollections: number;
  projectedTreasuryEnd: number;
  reservationCount: number;
  horizonLabel: string;
  points: TreasuryProjectionPoint[];
};

function getProjectionBucketStart(date: Date, bucket: "day" | "week" | "month") {
  if (bucket === "month") {
    return startOfMonth(date);
  }

  if (bucket === "week") {
    return startOfWeek(date, { weekStartsOn: 1 });
  }

  return startOfDay(date);
}

function buildProjectionBucketStarts(
  from: Date,
  to: Date,
  bucket: "day" | "week" | "month"
): Date[] {
  const starts: Date[] = [];
  let cursor = getProjectionBucketStart(from, bucket);

  while (cursor <= to) {
    starts.push(cursor);

    if (bucket === "month") {
      cursor = startOfMonth(addMonths(cursor, 1));
      continue;
    }

    if (bucket === "week") {
      cursor = startOfWeek(addWeeks(cursor, 1), { weekStartsOn: 1 });
      continue;
    }

    cursor = startOfDay(addDays(cursor, 1));
  }

  return starts;
}

export async function loadTreasuryProjection(
  projectionPeriod: DashboardKpiPeriod = "month",
  reference = new Date()
): Promise<TreasuryProjectionSnapshot> {
  const { from, to, label, bucket } = getProjectionHorizonRange(projectionPeriod, reference);
  const today = startOfDay(reference);

  const [currentNetTreasury, rows] = await Promise.all([
    loadCurrentNetTreasury(),
    prisma.transaction.findMany({
      where: {
        type: "REVENUE",
        isAdjustment: false,
        status: { not: "LITIGE_ANNULE" },
        remainingAmount: { gt: 0 },
      },
      select: {
        remainingAmount: true,
        revenueCategory: true,
        metadata: true,
        createdAt: true,
      },
    }),
  ]);

  const bucketAmounts = new Map<string, number>();
  const bucketCounts = new Map<string, number>();
  let reservationCount = 0;

  for (const row of rows) {
    let dueDate = getRevenueDueDate(row.revenueCategory, row.metadata, row.createdAt);

    if (startOfDay(dueDate) < today) {
      dueDate = today;
    }

    if (dueDate > to) {
      continue;
    }

    reservationCount += 1;
    const bucketStart = getProjectionBucketStart(dueDate, bucket);
    const key = bucketStart.toISOString();
    const amount = decimalToNumber(row.remainingAmount);

    bucketAmounts.set(key, roundMoney((bucketAmounts.get(key) ?? 0) + amount));
    bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
  }

  const bucketStarts = buildProjectionBucketStarts(from, to, bucket);
  let cumulativeCollections = 0;

  const points: TreasuryProjectionPoint[] = bucketStarts.map((start) => {
    const key = start.toISOString();
    const expectedCollections = bucketAmounts.get(key) ?? 0;
    cumulativeCollections = roundMoney(cumulativeCollections + expectedCollections);

    return {
      key,
      label: formatProjectionBucketLabel(start, bucket),
      expectedCollections,
      cumulativeCollections,
      projectedTreasury: roundMoney(currentNetTreasury + cumulativeCollections),
      reservationCount: bucketCounts.get(key) ?? 0,
    };
  });

  const totalExpectedCollections = roundMoney(cumulativeCollections);
  const projectedTreasuryEnd =
    points.length > 0 ? points[points.length - 1].projectedTreasury : currentNetTreasury;

  return {
    currentNetTreasury,
    totalExpectedCollections,
    projectedTreasuryEnd,
    reservationCount,
    horizonLabel: label,
    points,
  };
}
