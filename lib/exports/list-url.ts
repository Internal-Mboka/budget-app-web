import type { FinancialExportRegister } from "@/lib/exports/filters";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function buildExportsListHref(options: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  register?: FinancialExportRegister;
}) {
  const params = new URLSearchParams();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

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

  const query = params.toString();
  return query ? `/exports?${query}` : "/exports";
}
