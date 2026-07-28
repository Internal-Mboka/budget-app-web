import { roundMoney } from "@/lib/transactions/decimal";

export type AdjustmentKind = "PARTIAL" | "FULL";

export type TransactionAdjustmentMetadata = {
  reason: string;
  kind: AdjustmentKind;
  parentTransactionId: string;
  parentCode: string;
  createdAt: string;
};

export type TransactionAdjustmentRecord = {
  id: string;
  code: string;
  totalAmount: number;
  createdAt: string;
  metadata: TransactionAdjustmentMetadata | null;
};

export function parseTransactionAdjustmentMetadata(metadata: unknown): TransactionAdjustmentMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const adjustment = record.adjustment;

  if (!adjustment || typeof adjustment !== "object") {
    return null;
  }

  const data = adjustment as Record<string, unknown>;
  const kind = data.kind;

  if (kind !== "PARTIAL" && kind !== "FULL") {
    return null;
  }

  return {
    reason: String(data.reason ?? ""),
    kind,
    parentTransactionId: String(data.parentTransactionId ?? ""),
    parentCode: String(data.parentCode ?? ""),
    createdAt: String(data.createdAt ?? ""),
  };
}

export function sumAdjustmentAmounts(adjustments: Array<{ totalAmount: number }>): number {
  return roundMoney(adjustments.reduce((sum, entry) => sum + entry.totalAmount, 0));
}

export function getRemainingAdjustableAmount(
  parentTotalAmount: number,
  adjustments: Array<{ totalAmount: number }>
): number {
  return roundMoney(Math.max(parentTotalAmount - sumAdjustmentAmounts(adjustments), 0));
}

export function getNetTransactionAmount(
  parentTotalAmount: number,
  adjustments: Array<{ totalAmount: number }>
): number {
  return roundMoney(Math.max(parentTotalAmount - sumAdjustmentAmounts(adjustments), 0));
}

export function buildAdjustmentMetadata(input: {
  reason: string;
  kind: AdjustmentKind;
  parentTransactionId: string;
  parentCode: string;
}): { adjustment: TransactionAdjustmentMetadata } {
  return {
    adjustment: {
      reason: input.reason,
      kind: input.kind,
      parentTransactionId: input.parentTransactionId,
      parentCode: input.parentCode,
      createdAt: new Date().toISOString(),
    },
  };
}

export function getAdjustmentKindLabel(kind: AdjustmentKind): string {
  return kind === "FULL" ? "Régularisation totale" : "Régularisation partielle";
}
