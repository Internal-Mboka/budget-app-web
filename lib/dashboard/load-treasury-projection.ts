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
import {
  applyScenarioAmount,
  getCollectionWeight,
  getDisbursementWeight,
  type TreasuryProjectionScenario,
} from "@/lib/dashboard/treasury-projection-scenarios";
import { prisma } from "@/lib/prisma";
import { parseRecurringDueMetadata } from "@/lib/expenses/recurring";
import { getRevenueDueDate } from "@/lib/revenues/due-date";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type TreasuryProjectionPoint = {
  key: string;
  label: string;
  expectedCollections: number;
  expectedDisbursements: number;
  netFlow: number;
  cumulativeNetFlow: number;
  projectedTreasury: number;
  reservationCount: number;
  expenseCount: number;
};

export type TreasuryProjectionSnapshot = {
  scenario: TreasuryProjectionScenario;
  currentNetTreasury: number;
  totalExpectedCollections: number;
  totalExpectedDisbursements: number;
  projectedTreasuryEnd: number;
  reservationCount: number;
  expenseCount: number;
  beyondHorizonCollections: number;
  beyondHorizonDisbursements: number;
  beyondHorizonReservationCount: number;
  beyondHorizonExpenseCount: number;
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

function getExpenseDueDate(metadata: unknown, createdAt: Date, reference: Date): Date {
  const recurringDue = parseRecurringDueMetadata(metadata);

  if (recurringDue) {
    return startOfDay(new Date(`${recurringDue.dueDate}T12:00:00`));
  }

  const pendingEstimate = startOfDay(addDays(reference, 14));
  return createdAt > pendingEstimate ? startOfDay(createdAt) : pendingEstimate;
}

function clampDueDateToHorizonStart(dueDate: Date, today: Date): Date {
  return startOfDay(dueDate) < today ? today : startOfDay(dueDate);
}

type FlowBucket = {
  collections: number;
  disbursements: number;
  reservationCount: number;
  expenseCount: number;
};

function addToBucket(
  buckets: Map<string, FlowBucket>,
  dueDate: Date,
  bucket: "day" | "week" | "month",
  amount: number,
  kind: "collection" | "disbursement"
) {
  const key = getProjectionBucketStart(dueDate, bucket).toISOString();
  const entry = buckets.get(key) ?? {
    collections: 0,
    disbursements: 0,
    reservationCount: 0,
    expenseCount: 0,
  };

  if (kind === "collection") {
    entry.collections = roundMoney(entry.collections + amount);
    entry.reservationCount += 1;
  } else {
    entry.disbursements = roundMoney(entry.disbursements + amount);
    entry.expenseCount += 1;
  }

  buckets.set(key, entry);
}

export async function loadTreasuryProjection(
  projectionPeriod: DashboardKpiPeriod = "month",
  scenario: TreasuryProjectionScenario = "probable",
  reference = new Date()
): Promise<TreasuryProjectionSnapshot> {
  const { from, to, label, bucket } = getProjectionHorizonRange(projectionPeriod, reference);
  const today = startOfDay(reference);

  const [currentNetTreasury, revenueRows, expenseRows] = await Promise.all([
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
        paidAmount: true,
        status: true,
        revenueCategory: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        type: "EXPENSE",
        isAdjustment: false,
        approvalStatus: { not: "REJECTED" },
        remainingAmount: { gt: 0 },
      },
      select: {
        remainingAmount: true,
        approvalStatus: true,
        metadata: true,
        createdAt: true,
      },
    }),
  ]);

  const inHorizonBuckets = new Map<string, FlowBucket>();
  let totalExpectedCollections = 0;
  let totalExpectedDisbursements = 0;
  let reservationCount = 0;
  let expenseCount = 0;
  let beyondHorizonCollections = 0;
  let beyondHorizonDisbursements = 0;
  let beyondHorizonReservationCount = 0;
  let beyondHorizonExpenseCount = 0;

  for (const row of revenueRows) {
    const rawDueDate = getRevenueDueDate(row.revenueCategory, row.metadata, row.createdAt);
    const isOverdue = startOfDay(rawDueDate) < today;
    const amount = decimalToNumber(row.remainingAmount);
    const weightedAmount = applyScenarioAmount(
      amount,
      getCollectionWeight(scenario, row.status, decimalToNumber(row.paidAmount), isOverdue)
    );

    if (weightedAmount <= 0) {
      continue;
    }

    if (rawDueDate > to) {
      beyondHorizonCollections = roundMoney(beyondHorizonCollections + weightedAmount);
      beyondHorizonReservationCount += 1;
      continue;
    }

    reservationCount += 1;
    totalExpectedCollections = roundMoney(totalExpectedCollections + weightedAmount);
    const dueDate = clampDueDateToHorizonStart(rawDueDate, today);
    addToBucket(inHorizonBuckets, dueDate, bucket, weightedAmount, "collection");
  }

  for (const row of expenseRows) {
    const isRecurringDue = Boolean(parseRecurringDueMetadata(row.metadata));
    const rawDueDate = getExpenseDueDate(row.metadata, row.createdAt, reference);
    const amount = decimalToNumber(row.remainingAmount);
    const weightedAmount = applyScenarioAmount(
      amount,
      getDisbursementWeight(scenario, row.approvalStatus, isRecurringDue)
    );

    if (weightedAmount <= 0) {
      continue;
    }

    if (rawDueDate > to) {
      beyondHorizonDisbursements = roundMoney(beyondHorizonDisbursements + weightedAmount);
      beyondHorizonExpenseCount += 1;
      continue;
    }

    expenseCount += 1;
    totalExpectedDisbursements = roundMoney(totalExpectedDisbursements + weightedAmount);
    const dueDate = clampDueDateToHorizonStart(rawDueDate, today);
    addToBucket(inHorizonBuckets, dueDate, bucket, weightedAmount, "disbursement");
  }

  const bucketStarts = buildProjectionBucketStarts(from, to, bucket);
  let cumulativeNetFlow = 0;

  const points: TreasuryProjectionPoint[] = bucketStarts.map((start) => {
    const key = start.toISOString();
    const bucketData = inHorizonBuckets.get(key) ?? {
      collections: 0,
      disbursements: 0,
      reservationCount: 0,
      expenseCount: 0,
    };
    const netFlow = roundMoney(bucketData.collections - bucketData.disbursements);
    cumulativeNetFlow = roundMoney(cumulativeNetFlow + netFlow);

    return {
      key,
      label: formatProjectionBucketLabel(start, bucket),
      expectedCollections: bucketData.collections,
      expectedDisbursements: bucketData.disbursements,
      netFlow,
      cumulativeNetFlow,
      projectedTreasury: roundMoney(currentNetTreasury + cumulativeNetFlow),
      reservationCount: bucketData.reservationCount,
      expenseCount: bucketData.expenseCount,
    };
  });

  const projectedTreasuryEnd =
    points.length > 0 ? points[points.length - 1].projectedTreasury : currentNetTreasury;

  return {
    scenario,
    currentNetTreasury,
    totalExpectedCollections,
    totalExpectedDisbursements,
    projectedTreasuryEnd,
    reservationCount,
    expenseCount,
    beyondHorizonCollections,
    beyondHorizonDisbursements,
    beyondHorizonReservationCount,
    beyondHorizonExpenseCount,
    horizonLabel: label,
    points,
  };
}
