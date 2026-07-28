import type { FinancialExportRegister } from "@/lib/exports/filters";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function buildExportsListHref(options: {
  page?: number;
  pageSize?: number;
  justPage?: number;
  justPageSize?: number;
  from?: string;
  to?: string;
  register?: FinancialExportRegister;
}) {
  const params = new URLSearchParams();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const justPage = options.justPage ?? 1;
  const justPageSize = options.justPageSize ?? DEFAULT_PAGE_SIZE;

  if (options.from) {
    params.set("from", options.from);
  }

  if (options.to) {
    params.set("to", options.to);
  }

  if (options.register) {
    params.set("register", options.register);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(pageSize));
  }

  if (justPage > 1) {
    params.set("justPage", String(justPage));
  }

  if (justPageSize !== DEFAULT_PAGE_SIZE) {
    params.set("justPageSize", String(justPageSize));
  }

  const query = params.toString();
  return query ? `/exports?${query}` : "/exports";
}
