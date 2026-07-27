import type { AuditLogFilters } from "@/lib/audit/load-logs";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function buildAuditListHref(
  filters: Pick<AuditLogFilters, "from" | "to" | "action" | "entity" | "userId">,
  options?: { page?: number; pageSize?: number }
) {
  const params = new URLSearchParams();
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  if (filters.action) {
    params.set("action", filters.action);
  }

  if (filters.entity) {
    params.set("entity", filters.entity);
  }

  if (filters.userId) {
    params.set("userId", filters.userId);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  return query ? `/audit?${query}` : "/audit";
}
