"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { mbokaButtonPrimaryClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaErrorFallbackProps = {
  title?: string;
  description?: string;
  error?: Error & { digest?: string };
  onRetry?: () => void;
  testId?: string;
  className?: string;
};

export function MbokaErrorFallback({
  title = "Un problème est survenu",
  description = "Cette section n'a pas pu s'afficher. Vous pouvez réessayer sans recharger toute l'application.",
  error,
  onRetry,
  testId = "mboka-error-fallback",
  className,
}: MbokaErrorFallbackProps) {
  return (
    <section
      className={cn(
        mbokaPanelClassName,
        "mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center sm:px-10",
        className
      )}
      role="alert"
      data-testid={testId}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-[#10579F] dark:text-sky-50">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>

      {error?.digest ? (
        <p className="mt-3 font-mono text-xs text-slate-400 dark:text-slate-500">Réf. {error.digest}</p>
      ) : null}

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cn(mbokaButtonPrimaryClassName, "mt-6 min-h-11 px-5")}
          data-testid="mboka-error-retry-button"
        >
          <RefreshCw className="size-4" />
          Réessayer
        </button>
      ) : null}
    </section>
  );
}
