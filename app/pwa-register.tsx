"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PwaInstallPrompt } from "@/components/organisms/pwa-install-prompt";
import { OfflineSyncBridge } from "@/components/molecules/offline-sync-bridge";
import { PwaNetworkStatus } from "@/components/molecules/pwa-network-status";
import {
  getDefaultPwaInstallGuide,
  getPwaInstallGuide,
} from "@/lib/pwa/browser-install-guide";
import {
  isCypressTestRun,
  isPwaInstallContextPath,
  isStandaloneMode,
} from "@/lib/pwa/environment";
import {
  canShowPwaInstallPromptThisSession,
  clearPwaInstallPromptDismissed,
  isPwaInstallPromptDismissed,
  markPwaInstallPromptDismissed,
  markPwaInstallPromptShownThisSession,
} from "@/lib/pwa/storage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Délai après chargement de page avant d'afficher la card (hors login). */
const PROMPT_DELAY_MS = 3500;

function shouldOfferPwaInstallPrompt(): boolean {
  return (
    !isStandaloneMode() &&
    !isCypressTestRun() &&
    !isPwaInstallPromptDismissed() &&
    canShowPwaInstallPromptThisSession()
  );
}

export function PwaRegister() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [activePromptPath, setActivePromptPath] = useState<string | null>(null);
  const [installed, setInstalled] = useState(() =>
    typeof window !== "undefined" ? isStandaloneMode() : false
  );
  const [installGuide] = useState(() =>
    typeof window !== "undefined"
      ? getPwaInstallGuide(window.navigator.userAgent)
      : getDefaultPwaInstallGuide()
  );

  const showPrompt = activePromptPath === pathname;

  useEffect(() => {
    if (!isPwaInstallContextPath(pathname) || typeof window === "undefined") {
      return;
    }

    if (!shouldOfferPwaInstallPrompt()) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!shouldOfferPwaInstallPrompt()) {
        return;
      }

      markPwaInstallPromptShownThisSession();
      setActivePromptPath(pathname);
    }, PROMPT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed", error);
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (isCypressTestRun() || !isPwaInstallContextPath(pathname)) {
        return;
      }

      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setActivePromptPath(null);
      clearPwaInstallPromptDismissed();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [pathname]);

  async function installApp() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setActivePromptPath(null);
    }

    setDeferredPrompt(null);
  }

  function dismissPrompt() {
    markPwaInstallPromptDismissed();
    setActivePromptPath(null);
  }

  return (
    <>
      <OfflineSyncBridge />
      <PwaNetworkStatus />
      {installed || !showPrompt ? null : (
        <PwaInstallPrompt
          canInstallNatively={Boolean(deferredPrompt)}
          installGuide={installGuide}
          onInstall={installApp}
          onDismiss={dismissPrompt}
        />
      )}
    </>
  );
}
