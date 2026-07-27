"use client";

import { Download } from "lucide-react";

import { AuditLogFiltersPanel } from "@/components/organisms/audit-log-filters";
import { AuditLogTable } from "@/components/organisms/audit-log-table";
import type { AuditLogFilters, AuditLogListItem } from "@/lib/audit/load-logs";
import { mbokaButtonOutlineClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AuditLogsManagementProps = {
  items: AuditLogListItem[];
  total: number;
  page: number;
  totalPages: number;
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
  total,
  page,
  totalPages,
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
          Registre <strong>append-only</strong> : les entrées ne peuvent ni être modifiées ni supprimées depuis
          l&apos;application (US-45).
        </p>
      </section>

      <AuditLogFiltersPanel filters={filters} actors={actors} />

      {canExport ? (
        <div className="flex flex-wrap gap-2">
          <a href={buildExportHref(queryString, "csv")} className={mbokaButtonOutlineClassName} data-testid="audit-export-csv">
            <Download className="size-4" />
            Exporter CSV
          </a>
          <a
            href={buildExportHref(queryString, "json")}
            className={mbokaButtonOutlineClassName}
            data-testid="audit-export-json"
          >
            <Download className="size-4" />
            Exporter JSON
          </a>
        </div>
      ) : null}

      <AuditLogTable
        items={items}
        total={total}
        page={page}
        totalPages={totalPages}
        queryString={queryString}
      />
    </div>
  );
}
