"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import {
  revokeDeviceSessionsAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/lib/actions/sessions";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import type { PaginationMeta } from "@/lib/pagination";
import type { UserDeviceGroup } from "@/lib/sessions/device-groups";
import { buildSessionsListHref } from "@/lib/sessions/list-url";
import { MAX_ACTIVE_SESSIONS_PER_USER } from "@/lib/sessions/constants";
import { cn } from "@/lib/utils";

function formatRelativeDate(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

type ActiveSessionsPanelProps = {
  deviceGroups: UserDeviceGroup[];
  currentSessionId?: string;
  pagination: PaginationMeta;
  totalSessions: number;
  totalDevices: number;
};

function RelativeTime({ date }: { date: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(formatRelativeDate(new Date(date)));
  }, [date]);

  return (
    <span suppressHydrationWarning className="text-xs text-slate-500 dark:text-slate-500">
      Dernière activité {label || "—"}
    </span>
  );
}

function getDeviceActionLabel(group: UserDeviceGroup): string {
  if (group.isCurrentDevice && group.sessionCount === 1) {
    return "Se déconnecter";
  }

  if (group.isCurrentDevice) {
    return "Nettoyer cet appareil";
  }

  return "Révoquer cet appareil";
}

export function ActiveSessionsPanel({
  deviceGroups,
  currentSessionId,
  pagination,
  totalSessions,
  totalDevices,
}: ActiveSessionsPanelProps) {
  const router = useRouter();
  const [pendingFingerprint, setPendingFingerprint] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  const otherSessionsCount = Math.max(0, totalSessions - (currentSessionId ? 1 : 0));
  const otherDevicesCount = Math.max(0, totalDevices - (currentSessionId ? 1 : 0));
  const isNearSessionLimit = totalSessions >= MAX_ACTIVE_SESSIONS_PER_USER - 2;
  const isAtSessionLimit = totalSessions >= MAX_ACTIVE_SESSIONS_PER_USER;

  async function handleRevokeDevice(group: UserDeviceGroup) {
    setPendingFingerprint(group.fingerprint);

    const logoutCurrent = group.isCurrentDevice && group.sessionCount === 1;

    if (logoutCurrent && group.sessionIds[0]) {
      const formData = new FormData();
      formData.set("sessionId", group.sessionIds[0]);

      const result = await revokeSessionAction(formData);

      if (!result.success) {
        toast.error(result.error);
        setPendingFingerprint(null);
        return;
      }

      toast.success("Session fermée.");
      router.push("/login");
      router.refresh();
      return;
    }

    const formData = new FormData();
    formData.set("fingerprint", group.fingerprint);
    formData.set("isCurrentDevice", group.isCurrentDevice ? "true" : "false");

    const result = await revokeDeviceSessionsAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setPendingFingerprint(null);
      return;
    }

    toast.success(
      group.isCurrentDevice
        ? "Sessions en double retirées sur cet appareil."
        : "Appareil déconnecté."
    );
    setPendingFingerprint(null);
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

    toast.success("Tous les autres appareils ont été déconnectés.");
    setIsRevokingOthers(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section
        className={cn(mbokaPanelClassName, "p-4 sm:p-5")}
        data-testid="active-sessions-summary"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
              {totalDevices === 1 ? "1 appareil connecté" : `${totalDevices} appareils connectés`}
              {" · "}
              {totalSessions === 1 ? "1 session active" : `${totalSessions} sessions actives`}
            </p>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Un appareil regroupe les connexions d&apos;un même navigateur sur un poste. La
              révocation coupe toutes les sessions associées à cet appareil.
            </p>
            {isAtSessionLimit ? (
              <p
                className="text-xs leading-5 text-amber-700 dark:text-amber-300"
                data-testid="session-limit-notice"
              >
                Limite de {MAX_ACTIVE_SESSIONS_PER_USER} sessions atteinte — les connexions les
                plus anciennes sont retirées automatiquement à chaque nouvelle activité.
              </p>
            ) : isNearSessionLimit ? (
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                Limite douce : {MAX_ACTIVE_SESSIONS_PER_USER} sessions maximum par compte.
              </p>
            ) : null}
            {otherDevicesCount > 0 ? (
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                {otherDevicesCount} autre{otherDevicesCount > 1 ? "s" : ""} appareil
                {otherDevicesCount > 1 ? "s" : ""} peu{otherDevicesCount > 1 ? "vent" : "t"} être
                déconnecté{otherDevicesCount > 1 ? "s" : ""} ci-dessous.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            data-testid="revoke-other-sessions"
            className={cn(
              mbokaButtonOutlineClassName,
              "w-full shrink-0 whitespace-normal sm:w-auto sm:whitespace-nowrap"
            )}
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
              "Déconnecter tous les autres appareils"
            )}
          </button>
        </div>
      </section>

      <section className="space-y-3" data-testid="active-devices-list">
        {deviceGroups.map((group) => {
          const isPending = pendingFingerprint === group.fingerprint;
          const isLogoutAction = group.isCurrentDevice && group.sessionCount === 1;

          return (
            <article
              key={group.fingerprint}
              data-testid={`device-row-${group.fingerprint}`}
              className={cn(
                mbokaPanelClassName,
                "flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between",
                group.isCurrentDevice && "ring-1 ring-sky-200 dark:ring-sky-800"
              )}
            >
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
                  <MonitorSmartphone className="size-5" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                      {group.browser}
                    </h2>
                    {group.isCurrentDevice ? (
                      <span
                        data-testid="current-session-badge"
                        className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        Appareil actuel
                      </span>
                    ) : null}
                    {group.sessionCount > 1 ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-slate-800 dark:text-sky-300">
                        {group.sessionCount} sessions
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {group.deviceType} · IP {group.ipAddress}
                  </p>
                  <RelativeTime date={group.lastActiveAt} />
                </div>
              </div>

              <button
                type="button"
                data-testid={`revoke-device-${group.fingerprint}`}
                className={cn(
                  mbokaButtonPrimaryClassName,
                  "w-full shrink-0 self-start whitespace-nowrap lg:min-w-[10.5rem] lg:w-auto",
                  isLogoutAction && "bg-rose-600 hover:bg-rose-700"
                )}
                disabled={isPending}
                onClick={() => {
                  void handleRevokeDevice(group);
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  getDeviceActionLabel(group)
                )}
              </button>
            </article>
          );
        })}
      </section>

      <MbokaPagination
        meta={pagination}
        buildHref={(page, pageSize) => buildSessionsListHref({ page, pageSize })}
      />
    </div>
  );
}
