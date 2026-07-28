import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function buildUsersListHref(options?: { page?: number; pageSize?: number }) {
  const params = new URLSearchParams();
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  if (page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}
