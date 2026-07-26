"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/lib/actions/sessions";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import type { ActiveSessionRow } from "@/lib/sessions/service";
import { cn } from "@/lib/utils";

type ActiveSessionsPanelProps = {
  initialSessions: ActiveSessionRow[];
  currentSessionId?: string;
};

function formatRelativeDate(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

export function ActiveSessionsPanel({
  initialSessions,
  currentSessionId,
}: ActiveSessionsPanelProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const otherSessionsCount = sessions.filter((session) => session.id !== currentSessionId).length;

  async function handleRevokeSession(sessionId: string) {
    setPendingSessionId(sessionId);

    const formData = new FormData();
    formData.set("sessionId", sessionId);

    const result = await revokeSessionAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setPendingSessionId(null);
      return;
    }

    if (sessionId === currentSessionId) {
      toast.success("Session fermée.");
      router.push("/login");
      router.refresh();
      return;
    }

    setSessions((current) => current.filter((session) => session.id !== sessionId));
    toast.success("Appareil déconnecté.");
    setPendingSessionId(null);
    router.refresh();
  }

  async function handleRevokeOthers() {
    setIsRevokingOthers(true);

    const result = await revokeOtherSessionsAction();

    if (!result.success) {
      toast.error(result.error);
      setIsRevokingOthers(false);
      return;
    }

    setSessions((current) =>
      current.filter((session) => session.id === currentSessionId)
    );
    toast.success("Tous les autres appareils ont été déconnectés.");
    setIsRevokingOthers(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className={cn(mbokaPanelClassName, "space-y-4")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {sessions.length} session{sessions.length > 1 ? "s actives" : " active"}.
          </p>

          <button
            type="button"
            data-testid="revoke-other-sessions"
            className={cn(mbokaButtonOutlineClassName, "whitespace-nowrap")}
            disabled={otherSessionsCount === 0 || isRevokingOthers}
            onClick={() => {
              void handleRevokeOthers();
            }}
          >
            {isRevokingOthers ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Déconnexion...
              </>
            ) : (
              "Se déconnecter de tous les autres appareils"
            )}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          const isPending = pendingSessionId === session.id;

          return (
            <article
              key={session.id}
              data-testid={`session-row-${session.id}`}
              className={cn(
                mbokaPanelClassName,
                "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
                isCurrent && "ring-1 ring-sky-200 dark:ring-sky-800"
              )}
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
                  <MonitorSmartphone className="size-5" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                      {session.browser}
                    </h2>
                    {isCurrent ? (
                      <span
                        data-testid="current-session-badge"
                        className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        Session actuelle
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {session.deviceType} · IP {session.ipAddress}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Dernière activité {formatRelativeDate(session.lastActiveAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid={`revoke-session-${session.id}`}
                className={cn(
                  mbokaButtonPrimaryClassName,
                  "whitespace-nowrap sm:min-w-[140px]",
                  isCurrent && "bg-rose-600 hover:bg-rose-700"
                )}
                disabled={isPending}
                onClick={() => {
                  void handleRevokeSession(session.id);
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Traitement...
                  </>
                ) : isCurrent ? (
                  "Se déconnecter"
                ) : (
                  "Révoquer"
                )}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
