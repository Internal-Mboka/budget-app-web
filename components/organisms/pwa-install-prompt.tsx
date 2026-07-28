"use client";

import { Download, Share, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/atoms/logo";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type PwaInstallPromptProps = {
  canInstallNatively: boolean;
  isIos: boolean;
  isAndroid: boolean;
  onInstall: () => void | Promise<void>;
  onDismiss: () => void;
};

function ManualInstallSteps({ isIos, isAndroid }: { isIos: boolean; isAndroid: boolean }) {
  if (isIos) {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <li>Ouvrez cette page dans Safari si ce n&apos;est pas déjà le cas.</li>
        <li>Appuyez sur le bouton Partager en bas de l&apos;écran.</li>
        <li>Choisissez « Ajouter à l&apos;écran d&apos;accueil », puis validez.</li>
      </ol>
    );
  }

  if (isAndroid) {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <li>Appuyez sur les trois points en haut à droite de Chrome.</li>
        <li>Sélectionnez « Installer l&apos;application » ou « Ajouter à l&apos;écran d&apos;accueil ».</li>
        <li>Confirmez pour terminer l&apos;installation.</li>
      </ol>
    );
  }

  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
      <li>Ouvrez le menu de votre navigateur (souvent ⋮ ou ⋯ en haut à droite).</li>
      <li>Choisissez « Installer l&apos;application » ou « Ajouter à l&apos;écran d&apos;accueil ».</li>
      <li>Validez pour ajouter Mboka Budget sur votre appareil.</li>
    </ol>
  );
}

export function PwaInstallPrompt({
  canInstallNatively,
  isIos,
  isAndroid,
  onInstall,
  onDismiss,
}: PwaInstallPromptProps) {
  const [showManualSteps, setShowManualSteps] = useState(false);

  async function handleInstallClick() {
    if (canInstallNatively) {
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
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
      >
        <div className="bg-[linear-gradient(135deg,#8bd7ff_0%,#10579F_100%)] px-5 py-5 text-white">
          <div className="flex items-start gap-4">
            <Logo variant="badge" size="lg" className="shrink-0 bg-white/16 ring-white/25" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-sky-100 uppercase">
                Application Mboka
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
          <button
            type="button"
            onClick={handleInstallClick}
            className={cn(mbokaButtonPrimaryClassName, "w-full")}
            data-testid="pwa-install-button"
          >
            <Download className="size-4" />
            Installer Mboka Budget
          </button>

          {canInstallNatively ? (
            <p className="text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
              Un clic suffit pour ajouter l&apos;application à votre écran d&apos;accueil.
            </p>
          ) : null}

          {showManualSteps && !canInstallNatively ? (
            <div
              className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-slate-900/50"
              data-testid="pwa-manual-steps"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-[#10579F] dark:text-sky-100">
                {isIos ? <Share className="size-4" /> : <Download className="size-4" />}
                {isIos ? "Sur iPhone ou iPad" : "Quelques secondes pour terminer"}
              </div>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Votre navigateur ne propose pas encore l&apos;installation en un clic. Suivez ces étapes :
              </p>
              <ManualInstallSteps isIos={isIos} isAndroid={isAndroid} />
            </div>
          ) : null}

          {!canInstallNatively && !showManualSteps ? (
            <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
              Appuyez sur « Installer Mboka Budget » pour lancer l&apos;installation ou voir la marche à suivre.
            </p>
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
