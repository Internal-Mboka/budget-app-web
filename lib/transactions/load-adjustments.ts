import {
  getNetTransactionAmount,
  parseTransactionAdjustmentMetadata,
  type TransactionAdjustmentRecord,
} from "@/lib/transactions/adjustments";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { prisma } from "@/lib/prisma";

export async function loadTransactionAdjustments(transactionId: string): Promise<TransactionAdjustmentRecord[]> {
  const adjustments = await prisma.transaction.findMany({
    where: { parentTransactionId: transactionId, isAdjustment: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      code: true,
      totalAmount: true,
      metadata: true,
      createdAt: true,
    },
  });

  return adjustments.map((adjustment) => ({
    id: adjustment.id,
    code: adjustment.code,
    totalAmount: decimalToNumber(adjustment.totalAmount),
    createdAt: adjustment.createdAt.toISOString(),
    metadata: parseTransactionAdjustmentMetadata(adjustment.metadata),
  }));
}

export function computeNetAmount(
  parentTotalAmount: number,
  adjustments: TransactionAdjustmentRecord[]
): number {
  return getNetTransactionAmount(parentTotalAmount, adjustments);
}
