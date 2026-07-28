import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function buildClientDetailHref(
  clientId: string,
  options?: {
    txPage?: number;
    txPageSize?: number;
    notesPage?: number;
    notesPageSize?: number;
  }
) {
  const params = new URLSearchParams();
  const txPage = options?.txPage ?? 1;
  const txPageSize = options?.txPageSize ?? DEFAULT_PAGE_SIZE;
  const notesPage = options?.notesPage ?? 1;
  const notesPageSize = options?.notesPageSize ?? DEFAULT_PAGE_SIZE;

  if (txPage > 1) {
    params.set("txPage", String(txPage));
  }

  if (txPageSize !== DEFAULT_PAGE_SIZE) {
    params.set("txPageSize", String(txPageSize));
  }

  if (notesPage > 1) {
    params.set("notesPage", String(notesPage));
  }

  if (notesPageSize !== DEFAULT_PAGE_SIZE) {
    params.set("notesPageSize", String(notesPageSize));
  }

  const query = params.toString();
  return query ? `/clients/${clientId}?${query}` : `/clients/${clientId}`;
}
