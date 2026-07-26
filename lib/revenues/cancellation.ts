import { roundMoney } from "@/lib/transactions/decimal";

export type CancellationPenaltyMode = "REFUND_ALL" | "KEEP_DEPOSIT" | "CUSTOM";

export type RevenueCancellationMetadata = {
  reason: string;
  cancelledAt: string;
  penaltyMode: CancellationPenaltyMode;
  penaltyAmount?: number;
  previousTotalAmount: number;
  previousPaidAmount: number;
  penaltyKept: number;
  refundedAmount: number;
};

export type CancellationAmounts = {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  penaltyKept: number;
  refundedAmount: number;
};

export function computeCancellationAmounts(
  currentTotal: number,
  currentPaid: number,
  mode: CancellationPenaltyMode,
  customPenalty?: number
): CancellationAmounts {
  switch (mode) {
    case "REFUND_ALL":
      return {
        totalAmount: currentTotal,
        paidAmount: 0,
        remainingAmount: 0,
        penaltyKept: 0,
        refundedAmount: roundMoney(currentPaid),
      };
    case "KEEP_DEPOSIT":
      return {
        totalAmount: roundMoney(currentPaid),
        paidAmount: roundMoney(currentPaid),
        remainingAmount: 0,
        penaltyKept: roundMoney(currentPaid),
        refundedAmount: 0,
      };
    case "CUSTOM": {
      const penalty = roundMoney(customPenalty ?? 0);
      const penaltyKept = roundMoney(Math.min(Math.max(penalty, 0), currentPaid));
      const refundedAmount = roundMoney(Math.max(currentPaid - penaltyKept, 0));

      return {
        totalAmount: penaltyKept,
        paidAmount: penaltyKept,
        remainingAmount: 0,
        penaltyKept,
        refundedAmount,
      };
    }
    default:
      return {
        totalAmount: currentTotal,
        paidAmount: 0,
        remainingAmount: 0,
        penaltyKept: 0,
        refundedAmount: roundMoney(currentPaid),
      };
  }
}

export function parseRevenueCancellation(metadata: unknown): RevenueCancellationMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const cancellation = record.cancellation;

  if (!cancellation || typeof cancellation !== "object") {
    return null;
  }

  const data = cancellation as Record<string, unknown>;
  const penaltyMode = data.penaltyMode;

  if (
    penaltyMode !== "REFUND_ALL" &&
    penaltyMode !== "KEEP_DEPOSIT" &&
    penaltyMode !== "CUSTOM"
  ) {
    return null;
  }

  return {
    reason: String(data.reason ?? ""),
    cancelledAt: String(data.cancelledAt ?? ""),
    penaltyMode,
    penaltyAmount: typeof data.penaltyAmount === "number" ? data.penaltyAmount : undefined,
    previousTotalAmount: Number(data.previousTotalAmount ?? 0),
    previousPaidAmount: Number(data.previousPaidAmount ?? 0),
    penaltyKept: Number(data.penaltyKept ?? 0),
    refundedAmount: Number(data.refundedAmount ?? 0),
  };
}

export function withRevenueCancellation(
  metadata: unknown,
  cancellation: RevenueCancellationMetadata
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  return {
    ...base,
    cancellation,
  };
}

export function getCancellationPenaltyModeLabel(mode: CancellationPenaltyMode): string {
  switch (mode) {
    case "REFUND_ALL":
      return "Acompte remboursé intégralement";
    case "KEEP_DEPOSIT":
      return "Acompte conservé (pénalité no-show)";
    case "CUSTOM":
      return "Pénalité personnalisée";
    default:
      return mode;
  }
}

export const CANCELLATION_PENALTY_OPTIONS: Array<{ value: CancellationPenaltyMode; label: string }> = [
  { value: "REFUND_ALL", label: "Rembourser l'acompte" },
  { value: "KEEP_DEPOSIT", label: "Conserver l'acompte (no-show)" },
  { value: "CUSTOM", label: "Pénalité personnalisée" },
];
