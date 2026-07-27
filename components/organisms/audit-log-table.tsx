"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, ChevronRight } from "lucide-react";

import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import { getAuditActionLabel, getAuditEntityLabel } from "@/lib/audit/labels";
import type { AuditLogFilters, AuditLogListItem } from "@/lib/audit/load-logs";
import { buildAuditListHref } from "@/lib/audit/list-url";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import type { PaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type AuditLogTableProps = {
  items: AuditLogListItem[];
  pagination: PaginationMeta;
  filters: Pick<AuditLogFilters, "from" | "to" | "action" | "entity" | "userId">;
};

export function AuditLogTable({ items, pagination, filters }: AuditLogTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="audit-log-empty">
        Aucune entrée ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")} data-testid="audit-log-table">
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            data-testid={`audit-log-row-${item.id}`}
            className={cn(
              "overflow-hidden rounded-2xl border border-sky-100 bg-white/80 dark:border-sky-900 dark:bg-slate-900/40",
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
                  {item.user.firstName} {item.user.lastName} · {item.ipAddress ?? "Adresse IP inconnue"}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-slate-400" />
            </Link>
          </article>
        ))}
      </div>

      <MbokaPagination
        meta={pagination}
        buildHref={(page, pageSize) =>
          buildAuditListHref(filters, { page, pageSize: pageSize ?? pagination.pageSize })
        }
      />
    </section>
  );
}
