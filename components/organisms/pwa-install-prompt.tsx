"use client";

import { Download, Share, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/atoms/logo";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import type { PwaInstallGuide } from "@/lib/pwa/browser-install-guide";
import { cn } from "@/lib/utils";

type PwaInstallPromptProps = {
  canInstallNatively: boolean;
  installGuide: PwaInstallGuide;
  onInstall: () => void | Promise<void>;
  onDismiss: () => void;
};

function ManualInstallSteps({ guide }: { guide: PwaInstallGuide }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
      {guide.steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

export function PwaInstallPrompt({
  canInstallNatively,
  installGuide,
  onInstall,
  onDismiss,
}: PwaInstallPromptProps) {
  const [showManualSteps, setShowManualSteps] = useState(false);

  const canOneClick = canInstallNatively && installGuide.supportsOneClickInstall;
  const showInstallButton = canOneClick || installGuide.supportsManualInstall;

  async function handleInstallClick() {
    if (canOneClick) {
      await onInstall();
      return;
    }

    setShowManualSteps(true);
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6"
      role="presentation"
    >
      <section
        className={cn(
          mbokaPanelClassName,
          "pointer-events-auto w-full max-w-md overflow-hidden border-sky-100 shadow-[0_24px_80px_rgba(16,87,159,0.22)]"
        )}
        data-testid="pwa-install-prompt"
        data-browser={installGuide.browserId}
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
      >
        <div className="bg-[linear-gradient(135deg,#8bd7ff_0%,#10579F_100%)] px-5 py-5 text-white">
          <div className="flex items-start gap-4">
            <Logo variant="badge" size="lg" className="shrink-0 bg-white/16 ring-white/25" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-sky-100 uppercase">
                Application Mboka · {installGuide.browserLabel}
              </p>
              <h2 id="pwa-install-title" className="text-lg font-semibold leading-snug sm:text-xl">
                Installez Mboka Budget sur votre appareil
              </h2>
              <p id="pwa-install-description" className="text-sm leading-6 text-sky-50/95">
                Accès rapide, plein écran et expérience plus stable — idéal sur le terrain ou en régie.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Fermer le prompt d'installation"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {showInstallButton ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className={cn(mbokaButtonPrimaryClassName, "w-full")}
              data-testid="pwa-install-button"
            >
              <Download className="size-4" />
              {canOneClick ? "Installer Mboka Budget" : "Comment installer ?"}
            </button>
          ) : null}

          {canOneClick ? (
            <p className="text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
              Un clic suffit pour ajouter l&apos;application à votre appareil.
            </p>
          ) : null}

          {showManualSteps && !canOneClick ? (
            <div
              className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-slate-900/50"
              data-testid="pwa-manual-steps"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-[#10579F] dark:text-sky-100">
                {installGuide.browserId === "safari-ios" ? (
                  <Share className="size-4" />
                ) : (
                  <Download className="size-4" />
                )}
                {installGuide.title}
              </div>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{installGuide.intro}</p>
              <ManualInstallSteps guide={installGuide} />
              {installGuide.footnote ? (
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{installGuide.footnote}</p>
              ) : null}
            </div>
          ) : null}

          {!canOneClick && !showManualSteps && installGuide.supportsManualInstall ? (
            <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
              Appuyez sur « Comment installer ? » pour voir la marche à suivre adaptée à{" "}
              {installGuide.browserLabel}.
            </p>
          ) : null}

          {!installGuide.supportsManualInstall && installGuide.browserId === "firefox-desktop" ? (
            <div
              className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30"
              data-testid="pwa-manual-steps"
            >
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{installGuide.title}</p>
              <p className="text-sm leading-6 text-amber-950/90 dark:text-amber-50/90">{installGuide.intro}</p>
              <ManualInstallSteps guide={installGuide} />
              {installGuide.footnote ? (
                <p className="text-xs leading-5 text-amber-800/80 dark:text-amber-100/80">{installGuide.footnote}</p>
              ) : null}
            </div>
          ) : null}

          <ul className="grid gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <li>· Même connexion sécurisée que sur le site web.</li>
            <li>· Icône sur l&apos;écran d&apos;accueil, utilisable même si Internet est instable.</li>
            <li>· Vous pourrez revoir cette invitation à l&apos;installation plus tard.</li>
          </ul>

          <button
            type="button"
            data-testid="pwa-dismiss"
            onClick={onDismiss}
            className={cn(mbokaButtonOutlineClassName, "w-full")}
          >
            Plus tard
          </button>
        </div>
      </section>
    </div>
  );
}
