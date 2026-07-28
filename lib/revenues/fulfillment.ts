export type RevenueFulfillmentStatus = "REALIZED";

export type RevenueFulfillmentMetadata = {
  fulfillmentStatus?: RevenueFulfillmentStatus;
  realizedAt?: string;
};

export function parseRevenueFulfillment(metadata: unknown): RevenueFulfillmentMetadata {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const record = metadata as Record<string, unknown>;

  return {
    fulfillmentStatus:
      record.fulfillmentStatus === "REALIZED" ? "REALIZED" : undefined,
    realizedAt: typeof record.realizedAt === "string" ? record.realizedAt : undefined,
  };
}

export function isRevenueRealized(metadata: unknown): boolean {
  return parseRevenueFulfillment(metadata).fulfillmentStatus === "REALIZED";
}

export function withRevenueRealized(metadata: unknown): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  return {
    ...base,
    fulfillmentStatus: "REALIZED" satisfies RevenueFulfillmentStatus,
    realizedAt: new Date().toISOString(),
  };
}
