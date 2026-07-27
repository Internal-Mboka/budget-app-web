"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { AuditLogDiffView } from "@/components/molecules/audit-log-diff-view";
import { getAuditActionLabel, getAuditEntityLabel } from "@/lib/audit/labels";
import type { AuditLogDetail } from "@/lib/audit/load-logs";
import { parseSessionClientMeta } from "@/lib/sessions/user-agent";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AuditLogDetailPanelProps = {
  log: AuditLogDetail;
};

export function AuditLogDetailPanel({ log }: AuditLogDetailPanelProps) {
  const clientMeta = parseSessionClientMeta(log.userAgent, log.ipAddress, log.ipAddress);
  const createdLabel = format(new Date(log.createdAt), "d MMMM yyyy · HH:mm:ss", { locale: fr });

  return (
    <div className="space-y-6">
      <Link
        href="/audit"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
        data-testid="audit-log-back-link"
      >
        <ArrowLeft className="size-4" />
        Retour aux journaux
      </Link>

      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")} data-testid="audit-log-detail-panel">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              {getAuditActionLabel(log.action)}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{createdLabel}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={mbokaLabelClassName}>Auteur</p>
            <p className="mt-1 text-sm">
              {log.user.firstName} {log.user.lastName}
            </p>
            <p className="text-xs text-slate-500">{log.user.email}</p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Type d&apos;enregistrement</p>
            <p className="mt-1 text-sm">{getAuditEntityLabel(log.entity)}</p>
            {log.entityId ? <p className="text-xs text-slate-500">{log.entityId}</p> : null}
          </div>
          <div>
            <p className={mbokaLabelClassName}>Adresse IP</p>
            <p className="mt-1 text-sm" data-testid="audit-log-detail-ip">
              {log.ipAddress ?? "Inconnue"}
            </p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Appareil / navigateur</p>
            <p className="mt-1 text-sm" data-testid="audit-log-detail-user-agent">
              {clientMeta.deviceType} · {clientMeta.browser}
            </p>
            <p className="line-clamp-2 text-xs text-slate-500">{log.userAgent ?? "—"}</p>
          </div>
        </div>
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")} data-testid="audit-log-detail-diff">
        <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Détails enregistrés</h3>
        <AuditLogDiffView details={log.details} />
      </section>
    </div>
  );
}
