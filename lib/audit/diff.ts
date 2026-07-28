import { formatAuditDetailValue } from "./detail-format";

export type AuditDiffEntry = {
  key: string;
  before: unknown;
  after: unknown;
};

export type AuditDiffView = {
  mode: "diff" | "snapshot";
  changes: AuditDiffEntry[];
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  snapshot?: Record<string, unknown>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildAuditDiffView(details: unknown): AuditDiffView | null {
  if (!isPlainObject(details)) {
    return null;
  }

  const before = isPlainObject(details.before) ? details.before : undefined;
  const after = isPlainObject(details.after) ? details.after : undefined;

  if (before && after) {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
    const changes = keys
      .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      .map((key) => ({
        key,
        before: before[key],
        after: after[key],
      }));

    return {
      mode: "diff",
      changes,
      before,
      after,
    };
  }

  const snapshot = { ...details };

  delete snapshot.before;
  delete snapshot.after;
  delete snapshot.performedBy;

  if (Object.keys(snapshot).length === 0) {
    return null;
  }

  return {
    mode: "snapshot",
    changes: [],
    snapshot,
  };
}

export function formatAuditValue(value: unknown, key = ""): string {
  return formatAuditDetailValue(key, value);
}
