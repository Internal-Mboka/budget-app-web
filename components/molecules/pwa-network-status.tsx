"use client";

import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { mbokaButtonOutlineClassName } from "@/lib/design-tokens";
import { useNetworkStatus } from "@/lib/pwa/use-network-status";
import { cn } from "@/lib/utils";

export function PwaNetworkStatus() {
  const pathname = usePathname();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (pathname === "/offline") {
    return null;
  }

  async function refreshAfterReconnect() {
    setIsRefreshing(true);

    try {
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
        <span className="inline-flex items-center gap-2 font-medium">
          <WifiOff className="size-4 shrink-0" aria-hidden />
          Connexion perdue — consultation des dernières données en cache. Les saisies sont suspendues.
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
          <span className="inline-flex items-center gap-2 font-medium">
            <Wifi className="size-4 shrink-0" aria-hidden />
            Connexion rétablie — synchronisation disponible.
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
            {isRefreshing ? "Actualisation…" : "Actualiser les données"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
