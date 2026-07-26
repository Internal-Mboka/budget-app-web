import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
};

const paginationInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
});

export function parsePagination(input: {
  page?: string | string[] | number;
  pageSize?: string | string[] | number;
}): PaginationParams {
  const pageRaw = Array.isArray(input.page) ? input.page[0] : input.page;
  const pageSizeRaw = Array.isArray(input.pageSize) ? input.pageSize[0] : input.pageSize;

  const parsed = paginationInputSchema.parse({
    page: pageRaw ?? 1,
    pageSize: pageSizeRaw ?? DEFAULT_PAGE_SIZE,
  });

  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    skip: (parsed.page - 1) * parsed.pageSize,
    take: parsed.pageSize,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(safePage * pageSize, total);

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    from,
    to,
  };
}

export function paginateArray<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const meta = buildPaginationMeta(total, page, pageSize);
  const start = (meta.page - 1) * pageSize;
  const rows = items.slice(start, start + pageSize);

  return { rows, meta };
}
