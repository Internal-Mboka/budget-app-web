import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function buildClientDetailHref(clientId: string, options?: { txPage?: number; txPageSize?: number }) {
  const params = new URLSearchParams();
  const txPage = options?.txPage ?? 1;
  const txPageSize = options?.txPageSize ?? DEFAULT_PAGE_SIZE;

  if (txPage > 1) {
    params.set("txPage", String(txPage));
  }

  if (txPageSize !== DEFAULT_PAGE_SIZE) {
    params.set("txPageSize", String(txPageSize));
  }

  const query = params.toString();
  return query ? `/clients/${clientId}?${query}` : `/clients/${clientId}`;
}
