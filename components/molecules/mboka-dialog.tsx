"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaDialogSize = "sm" | "md";

type MbokaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: MbokaDialogSize;
  testId?: string;
  backdropTestId?: string;
  closeOnBackdrop?: boolean;
};

const sizeClassNames: Record<MbokaDialogSize, string> = {
  sm: "w-full max-w-lg",
  md: "max-h-[90vh] w-full max-w-2xl overflow-y-auto",
};

export function MbokaDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = "md",
  testId,
  backdropTestId,
  closeOnBackdrop = true,
}: MbokaDialogProps) {
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement?.focus();
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) {
    return null;
  }

  function handleBackdropClick() {
    if (closeOnBackdrop) {
      onOpenChange(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      data-testid={backdropTestId}
      onClick={handleBackdropClick}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        className={cn(mbokaPanelClassName, sizeClassNames[size], "p-5 sm:p-6", className)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fermer"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-sky-50 hover:text-[#10579F] dark:hover:bg-slate-800"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        {children}
      </section>
    </div>,
    document.body
  );
}
