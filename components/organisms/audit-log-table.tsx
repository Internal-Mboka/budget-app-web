"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, ChevronRight } from "lucide-react";

import { getAuditActionLabel, getAuditEntityLabel } from "@/lib/audit/labels";
import type { AuditLogListItem } from "@/lib/audit/load-logs";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AuditLogTableProps = {
  items: AuditLogListItem[];
  total: number;
  page: number;
  totalPages: number;
  queryString: string;
};

function buildPageHref(queryString: string, page: number): string {
  const params = new URLSearchParams(queryString);
  params.set("page", String(page));
  const query = params.toString();
  return query ? `/audit?${query}` : `/audit?page=${page}`;
}

export function AuditLogTable({ items, total, page, totalPages, queryString }: AuditLogTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="audit-log-empty">
        Aucune entrée ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <section className="space-y-3" data-testid="audit-log-table">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {total} entrée{total > 1 ? "s" : ""} · page {page}/{totalPages}
      </p>

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            data-testid={`audit-log-row-${item.id}`}
            className={cn(
              mbokaPanelClassName,
              "overflow-hidden",
              item.action === "SECURITY_ALERT" && "border-rose-200 dark:border-rose-900"
            )}
          >
            <Link
              href={`/audit/${item.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              data-testid={`audit-log-link-${item.id}`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                    {getAuditActionLabel(item.action)}
                  </span>
                  {item.action === "SECURITY_ALERT" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      <AlertTriangle className="size-3" />
                      Alerte
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date(item.createdAt), "d MMM yyyy · HH:mm", { locale: fr })} ·{" "}
                  {getAuditEntityLabel(item.entity)}
                  {item.entityId ? ` · ${item.entityId.slice(0, 8)}…` : ""}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {item.user.firstName} {item.user.lastName} · {item.ipAddress ?? "IP inconnue"}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-slate-400" />
            </Link>
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {page > 1 ? (
            <Link
              href={buildPageHref(queryString, page - 1)}
              className={cn(mbokaPanelClassName, "px-3 py-2 text-sm")}
            >
              ← Précédent
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={buildPageHref(queryString, page + 1)}
              className={cn(mbokaPanelClassName, "px-3 py-2 text-sm")}
            >
              Suivant →
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
