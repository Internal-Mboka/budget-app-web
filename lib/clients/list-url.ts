import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function parseClientTagsParam(tagsParam?: string | string[]) {
  const raw = Array.isArray(tagsParam) ? tagsParam.join(",") : tagsParam;

  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function buildClientsListHref(options: {
  page?: number;
  pageSize?: number;
  tags?: string[];
}) {
  const params = new URLSearchParams();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  if (page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(pageSize));
  }

  if (options.tags && options.tags.length > 0) {
    params.set("tags", options.tags.join(","));
  }

  const query = params.toString();
  return query ? `/clients?${query}` : "/clients";
}
