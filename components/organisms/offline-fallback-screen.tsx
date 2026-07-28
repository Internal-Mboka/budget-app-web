"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/atoms/logo";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaPageClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function OfflineFallbackScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    function handleOnline() {
      setIsOnline(true);
      window.location.reload();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function retryConnection() {
    setIsRetrying(true);

    try {
      if (navigator.onLine) {
        window.location.reload();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div className={cn(mbokaPageClassName, "flex min-h-screen items-center justify-center px-4 py-10")}>
      <div
        className={cn(mbokaPanelClassName, "w-full max-w-lg space-y-6 p-6 sm:p-8")}
        data-testid="offline-fallback-screen"
      >
        <Logo variant="auth" />

        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-sky-50 text-[#10579F] ring-1 ring-sky-100 dark:bg-slate-800 dark:text-sky-300 dark:ring-sky-900">
            <WifiOff className="size-7" aria-hidden />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-400 uppercase">Hors connexion</p>
            <h1 className="text-2xl font-semibold text-[#10579F] dark:text-sky-50">Vous êtes hors ligne</h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              La connexion internet est momentanément indisponible. Mboka Budget conserve l&apos;interface et les
              dernières données consultées en cache, mais les chiffres en direct ne peuvent pas être chargés.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-sky-900 dark:bg-slate-900/50 dark:text-slate-300">
          <p className="font-medium text-[#10579F] dark:text-sky-100">Que faire ?</p>
          <ul className="mt-2 space-y-1.5">
            <li>· Vérifiez le Wi‑Fi ou les données mobiles.</li>
            <li>· Revenez sur une page déjà visitée — elle peut rester accessible.</li>
            <li>· La page se rechargera automatiquement dès que le réseau revient.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={retryConnection}
            disabled={isRetrying}
            className={cn(mbokaButtonPrimaryClassName, "w-full sm:flex-1")}
            data-testid="offline-retry-button"
          >
            <RefreshCw className={cn("size-4", isRetrying && "animate-spin")} />
            {isRetrying ? "Vérification…" : "Réessayer"}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className={cn(mbokaButtonOutlineClassName, "w-full sm:flex-1")}
          >
            Page précédente
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400" data-testid="offline-network-status">
          {isOnline ? "Connexion détectée — rechargement imminent…" : "En attente de connexion…"}
        </p>
      </div>
    </div>
  );
}
