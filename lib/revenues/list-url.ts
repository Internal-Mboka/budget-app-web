type RevenuesListParams = {
  page?: number;
  pageSize?: number;
};

export function buildRevenuesListHref(params: RevenuesListParams = {}): string {
  const searchParams = new URLSearchParams();

  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.pageSize) {
    searchParams.set("pageSize", String(params.pageSize));
  }

  const query = searchParams.toString();
  return query ? `/revenues?${query}` : "/revenues";
}
