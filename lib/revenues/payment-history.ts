import type { PaymentMethod } from "@prisma/client";

export type RevenuePaymentEntryKind = "INITIAL" | "INSTALLMENT";

export type RevenuePaymentEntry = {
  id: string;
  kind: RevenuePaymentEntryKind;
  amount: number;
  paymentMethod?: PaymentMethod | null;
  recordedAt: string;
  recordedBy?: string;
  paidAfter: number;
  remainingAfter: number;
};

export function parseRevenuePaymentHistory(metadata: unknown): RevenuePaymentEntry[] {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const record = metadata as Record<string, unknown>;
  const history = record.paymentHistory;

  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry): RevenuePaymentEntry | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const kind = item.kind;

      if (kind !== "INITIAL" && kind !== "INSTALLMENT") {
        return null;
      }

      const id = String(item.id ?? "");
      const amount = Number(item.amount ?? 0);

      if (!id || amount < 0) {
        return null;
      }

      return {
        id,
        kind,
        amount,
        paymentMethod: (item.paymentMethod as PaymentMethod | null | undefined) ?? null,
        recordedAt: String(item.recordedAt ?? ""),
        recordedBy: typeof item.recordedBy === "string" ? item.recordedBy : undefined,
        paidAfter: Number(item.paidAfter ?? 0),
        remainingAfter: Number(item.remainingAfter ?? 0),
      };
    })
    .filter((entry): entry is RevenuePaymentEntry => entry !== null);
}

export function appendRevenuePaymentHistory(
  metadata: unknown,
  entry: RevenuePaymentEntry
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  const current = parseRevenuePaymentHistory(base);

  return {
    ...base,
    paymentHistory: [...current, entry],
  };
}

export function createInitialPaymentEntry(input: {
  amount: number;
  paymentMethod?: PaymentMethod | null;
  recordedBy?: string;
  paidAfter: number;
  remainingAfter: number;
  recordedAt?: string;
}): RevenuePaymentEntry | null {
  if (input.amount <= 0) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    kind: "INITIAL",
    amount: input.amount,
    paymentMethod: input.paymentMethod ?? null,
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    recordedBy: input.recordedBy,
    paidAfter: input.paidAfter,
    remainingAfter: input.remainingAfter,
  };
}

export function createInstallmentPaymentEntry(input: {
  amount: number;
  paymentMethod?: PaymentMethod | null;
  recordedBy?: string;
  paidAfter: number;
  remainingAfter: number;
}): RevenuePaymentEntry {
  return {
    id: crypto.randomUUID(),
    kind: "INSTALLMENT",
    amount: input.amount,
    paymentMethod: input.paymentMethod ?? null,
    recordedAt: new Date().toISOString(),
    recordedBy: input.recordedBy,
    paidAfter: input.paidAfter,
    remainingAfter: input.remainingAfter,
  };
}

export function getRevenuePaymentHistoryForDisplay(
  metadata: unknown,
  paidAmount: number,
  createdAt: string
): RevenuePaymentEntry[] {
  const parsed = parseRevenuePaymentHistory(metadata);

  if (parsed.length > 0) {
    return [...parsed].sort(
      (left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime()
    );
  }

  if (paidAmount > 0) {
    return [
      {
        id: "legacy-initial",
        kind: "INITIAL",
        amount: paidAmount,
        paymentMethod: null,
        recordedAt: createdAt,
        paidAfter: paidAmount,
        remainingAfter: 0,
      },
    ];
  }

  return [];
}

export function getPaymentEntryKindLabel(kind: RevenuePaymentEntryKind): string {
  return kind === "INITIAL" ? "Acompte initial" : "Versement complémentaire";
}
