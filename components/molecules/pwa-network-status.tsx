"use client";

import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { mbokaButtonOutlineClassName } from "@/lib/design-tokens";
import { processOfflineSyncQueue } from "@/lib/pwa/offline-sync-queue";
import { useNetworkStatus } from "@/lib/pwa/use-network-status";
import { useOfflineSyncPendingCount } from "@/lib/pwa/use-offline-sync-pending-count";
import { cn } from "@/lib/utils";

export function PwaNetworkStatus() {
  const pathname = usePathname();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const pendingCount = useOfflineSyncPendingCount();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (pathname === "/offline") {
    return null;
  }

  async function refreshAfterReconnect() {
    setIsRefreshing(true);

    try {
      const syncResult = await processOfflineSyncQueue();

      if (syncResult.synced > 0) {
        toast.success(
          syncResult.synced === 1
            ? "1 saisie en attente a été envoyée."
            : `${syncResult.synced} saisies en attente ont été envoyées.`
        );
      }

      if (syncResult.failed > 0) {
        toast.error("Certaines saisies en attente n'ont pas pu être envoyées.");
      }

      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 400));
    } finally {
      setIsRefreshing(false);
    }
  }

  if (networkStatus === "offline") {
    return (
      <div
        className="fixed inset-x-0 top-0 z-[60] border-b border-amber-200 bg-amber-50/95 px-4 py-2 text-center text-sm text-amber-950 backdrop-blur dark:border-amber-900 dark:bg-amber-950/90 dark:text-amber-100"
        role="status"
        data-testid="pwa-network-offline-banner"
      >
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-medium">
          <WifiOff className="size-4 shrink-0" aria-hidden />
          <span>
            Connexion perdue — vous pouvez préparer une saisie revenu ; elle sera envoyée à la reconnexion.
          </span>
          {pendingCount > 0 ? (
            <span
              className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-50"
              data-testid="offline-sync-pending-count"
            >
              {pendingCount} en attente
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  if (networkStatus === "reconnected") {
    return (
      <div
        className="fixed inset-x-0 top-0 z-[60] border-b border-emerald-200 bg-emerald-50/95 px-4 py-2 text-sm text-emerald-950 backdrop-blur dark:border-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100"
        role="status"
        data-testid="pwa-network-reconnected-banner"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3">
          <span className="inline-flex flex-wrap items-center justify-center gap-2 font-medium">
            <Wifi className="size-4 shrink-0" aria-hidden />
            Connexion rétablie
            {pendingCount > 0 ? (
              <span data-testid="offline-sync-pending-count">
                — {pendingCount} saisie{pendingCount > 1 ? "s" : ""} en attente d&apos;envoi
              </span>
            ) : (
              <span> — synchronisation disponible</span>
            )}
          </span>
          <button
            type="button"
            onClick={refreshAfterReconnect}
            disabled={isRefreshing}
            className={cn(
              mbokaButtonOutlineClassName,
              "border-emerald-200 bg-white/80 px-3 py-1.5 text-xs dark:border-emerald-800 dark:bg-emerald-950/40"
            )}
            data-testid="pwa-network-refresh-button"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Envoi en cours…" : "Envoyer et actualiser"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
