"use client";

import { buildAuditDiffView, formatAuditValue } from "@/lib/audit/diff";
import { mbokaLabelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AuditLogDiffViewProps = {
  details: unknown;
};

export function AuditLogDiffView({ details }: AuditLogDiffViewProps) {
  const view = buildAuditDiffView(details);

  if (!view) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="audit-log-diff-empty">
        Aucun détail supplémentaire enregistré pour cet événement.
      </p>
    );
  }

  if (view.mode === "snapshot" && view.snapshot) {
    return (
      <div className="space-y-2" data-testid="audit-log-diff-snapshot">
        {Object.entries(view.snapshot).map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{key}</p>
            <pre className="mt-1 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200">
              {formatAuditValue(value)}
            </pre>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="audit-log-diff-panel">
      {view.changes.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Aucune différence détectée.</p>
      ) : (
        view.changes.map((change) => (
          <div
            key={change.key}
            className="grid gap-2 rounded-2xl border border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-2"
            data-testid={`audit-log-diff-${change.key}`}
          >
            <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2 dark:border-rose-900 dark:bg-rose-950/20">
              <p className={cn(mbokaLabelClassName, "mb-1 text-rose-700 dark:text-rose-300")}>Avant</p>
              <p className="text-xs font-medium text-slate-500">{change.key}</p>
              <pre className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">
                {formatAuditValue(change.before)}
              </pre>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/20">
              <p className={cn(mbokaLabelClassName, "mb-1 text-emerald-700 dark:text-emerald-300")}>Après</p>
              <p className="text-xs font-medium text-slate-500">{change.key}</p>
              <pre className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">
                {formatAuditValue(change.after)}
              </pre>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
