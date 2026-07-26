"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STORAGE_KEY = "mboka-pwa-install-dismissed";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    ("standalone" in window.navigator && window.navigator.standalone === true)
  );
}

function detectIos() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isCypressTestRun() {
  if (typeof window === "undefined") {
    return false;
  }

  return "Cypress" in window;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const isIos = useMemo(() => detectIos(), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setInstalled(isStandaloneMode());

    const dismissed = window.localStorage.getItem(STORAGE_KEY) === "true";

    if (!dismissed && !isStandaloneMode() && !isCypressTestRun()) {
      setShowPrompt(true);
    }

    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (isCypressTestRun()) {
        return;
      }

      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowPrompt(false);
      window.localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

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
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }

    setShowPrompt(false);
  }

  if (installed || !showPrompt) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <section className="pointer-events-auto w-full max-w-md overflow-hidden rounded-4xl border border-sky-100 bg-white shadow-[0_20px_70px_rgba(16,87,159,0.18)]">
        <div className="bg-[linear-gradient(135deg,#8bd7ff_0%,#10579F_100%)] px-5 py-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/16 ring-1 ring-white/20 backdrop-blur">
              <Image
                src="/photos/mboka.png"
                alt="Logo Mboka"
                width={64}
                height={64}
                className="h-14 w-14 object-contain"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(2%) hue-rotate(193deg) brightness(104%) contrast(101%)",
                }}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">PWA Mboka</p>
              <h2 className="mt-2 text-xl font-semibold">Installe l&apos;application sur ton accueil</h2>
              <p className="mt-2 text-sm leading-5 text-sky-50">
                Ajoute Mboka Budget sur l&apos;ecran d&apos;accueil pour un acces rapide, plein ecran et plus stable.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 text-[#10579F]">
          {deferredPrompt ? (
            <>
              <p className="text-sm leading-6 text-slate-600">
                Ton navigateur supporte l&apos;installation directe. Appuie sur le bouton ci-dessous pour enregistrer l&apos;application.
              </p>
              <button
                type="button"
                onClick={installApp}
                className="w-full rounded-2xl bg-[#10579F] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200"
              >
                Installer Mboka Budget
              </button>
            </>
          ) : isIos ? (
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-slate-600">
              Sur iPhone ou iPad : ouvre le menu Partager de Safari, puis choisis Ajouter a l&apos;ecran d&apos;accueil.
            </div>
          ) : (
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-slate-600">
              Si le bouton d&apos;installation n&apos;apparait pas, ouvre le menu du navigateur puis choisis Installer l&apos;application ou Ajouter a l&apos;ecran d&apos;accueil.
            </div>
          )}

          <div className="grid gap-2 text-xs text-slate-500">
            <p>1. Ouvre Mboka Budget dans ton navigateur.</p>
            <p>2. Installe l&apos;application avec le bouton ou le menu du navigateur.</p>
            <p>3. Lance ensuite Mboka Budget depuis l&apos;ecran d&apos;accueil.</p>
          </div>

          <button
            type="button"
            data-testid="pwa-dismiss"
            onClick={dismissPrompt}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
          >
            Fermer pour le moment
          </button>
        </div>
      </section>
    </div>
  );
}
