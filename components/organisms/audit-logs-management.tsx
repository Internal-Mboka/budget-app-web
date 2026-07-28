"use client";

import { Download } from "lucide-react";

import { AuditLogFiltersPanel } from "@/components/organisms/audit-log-filters";
import { AuditLogTable } from "@/components/organisms/audit-log-table";
import type { AuditLogFilters, AuditLogListItem } from "@/lib/audit/load-logs";
import { mbokaButtonOutlineClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import type { PaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type AuditLogsManagementProps = {
  items: AuditLogListItem[];
  pagination: PaginationMeta;
  filters: AuditLogFilters;
  actors: Array<{ id: string; label: string; email: string }>;
  canExport: boolean;
  queryString: string;
};

function buildExportHref(queryString: string, format: "csv" | "json"): string {
  const params = new URLSearchParams(queryString);
  params.delete("page");
  params.set("format", format);
  const query = params.toString();
  return query ? `/api/audit/export?${query}` : `/api/audit/export?format=${format}`;
}

export function AuditLogsManagement({
  items,
  pagination,
  filters,
  actors,
  canExport,
  queryString,
}: AuditLogsManagementProps) {
  return (
    <div className="space-y-6">
      <section
        className={cn(mbokaPanelClassName, "space-y-2 p-4 sm:p-5")}
        data-testid="audit-log-immutability-note"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ce registre est protégé&nbsp;: une fois enregistrée, une action ne peut plus être modifiée ni effacée
          depuis l&apos;application.
        </p>
      </section>

      <AuditLogFiltersPanel filters={filters} actors={actors} />

      {canExport ? (
        <div className="flex flex-wrap gap-2">
          <a href={buildExportHref(queryString, "csv")} className={mbokaButtonOutlineClassName} data-testid="audit-export-csv">
            <Download className="size-4" />
            Exporter en CSV
          </a>
          <a
            href={buildExportHref(queryString, "json")}
            className={mbokaButtonOutlineClassName}
            data-testid="audit-export-json"
          >
            <Download className="size-4" />
            Exporter en JSON
          </a>
        </div>
      ) : null}

      <AuditLogTable items={items} pagination={pagination} filters={filters} />
    </div>
  );
}
