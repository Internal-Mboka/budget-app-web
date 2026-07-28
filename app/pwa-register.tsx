"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PwaInstallPrompt } from "@/components/organisms/pwa-install-prompt";
import { OfflineSyncBridge } from "@/components/molecules/offline-sync-bridge";
import { PwaNetworkStatus } from "@/components/molecules/pwa-network-status";
import {
  getDefaultPwaInstallGuide,
  getPwaInstallGuide,
  type PwaInstallGuide,
} from "@/lib/pwa/browser-install-guide";
import {
  isCypressTestRun,
  isPwaInstallContextPath,
  isStandaloneMode,
} from "@/lib/pwa/environment";
import {
  clearPwaInstallPromptDismissed,
  isPwaInstallPromptDismissed,
  markPwaInstallPromptDismissed,
} from "@/lib/pwa/storage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PROMPT_DELAY_MS = 1800;

export function PwaRegister() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installGuide, setInstallGuide] = useState<PwaInstallGuide>(getDefaultPwaInstallGuide);

  useEffect(() => {
    setInstallGuide(getPwaInstallGuide(window.navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!isPwaInstallContextPath(pathname)) {
      setShowPrompt(false);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    setInstalled(isStandaloneMode());

    if (
      isStandaloneMode() ||
      isCypressTestRun() ||
      isPwaInstallPromptDismissed()
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowPrompt(true);
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
      setShowPrompt(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowPrompt(false);
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
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  }

  function dismissPrompt() {
    markPwaInstallPromptDismissed();
    setShowPrompt(false);
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
