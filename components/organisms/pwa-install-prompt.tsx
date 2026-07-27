"use client";

import { Download, Share, Smartphone, X } from "lucide-react";

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
  onInstall: () => void;
  onDismiss: () => void;
};

export function PwaInstallPrompt({
  canInstallNatively,
  isIos,
  onInstall,
  onDismiss,
}: PwaInstallPromptProps) {
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
          {canInstallNatively ? (
            <>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Votre navigateur permet une installation directe. Un clic suffit pour ajouter l&apos;application à
                votre écran d&apos;accueil.
              </p>
              <button
                type="button"
                onClick={onInstall}
                className={cn(mbokaButtonPrimaryClassName, "w-full")}
                data-testid="pwa-install-button"
              >
                <Download className="size-4" />
                Installer Mboka Budget
              </button>
            </>
          ) : isIos ? (
            <div className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-sm font-medium text-[#10579F] dark:text-sky-100">
                <Share className="size-4" />
                Installation sur iPhone ou iPad
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li>Ouvrez Mboka Budget dans Safari.</li>
                <li>Appuyez sur le bouton Partager en bas de l&apos;écran.</li>
                <li>Choisissez « Ajouter à l&apos;écran d&apos;accueil ».</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-sm font-medium text-[#10579F] dark:text-sky-100">
                <Smartphone className="size-4" />
                Installation manuelle
              </div>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Ouvrez le menu de votre navigateur (⋮ ou ⋯), puis sélectionnez « Installer l&apos;application » ou
                « Ajouter à l&apos;écran d&apos;accueil ».
              </p>
            </div>
          )}

          <ul className="grid gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <li>· Connexion sécurisée identique à la version web.</li>
            <li>· Shell applicatif disponible même avec un réseau instable.</li>
            <li>· Vous pourrez relancer ce message depuis le menu plus tard.</li>
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
