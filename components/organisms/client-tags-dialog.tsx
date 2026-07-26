"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ClientTagsEditor } from "@/components/organisms/client-tags-editor";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ClientTagsDialogProps = {
  open: boolean;
  client: { id: string; name: string; tags: string[] } | null;
  onOpenChange: (open: boolean) => void;
  onTagsChange?: (clientId: string, tags: string[]) => void;
};

export function ClientTagsDialog({
  open,
  client,
  onOpenChange,
  onTagsChange,
}: ClientTagsDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !client || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      data-testid="client-tags-backdrop"
      onClick={() => onOpenChange(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-tags-title"
        data-testid="client-tags-dialog"
        className={cn(mbokaPanelClassName, "w-full max-w-lg space-y-5 p-5 sm:p-6")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="client-tags-title" className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Tags — {client.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Segmentation commerciale et conditions spécifiques.
            </p>
          </div>

          <button
            type="button"
            aria-label="Fermer"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-sky-50 hover:text-[#10579F] dark:hover:bg-slate-800"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <ClientTagsEditor
          clientId={client.id}
          tags={client.tags}
          onTagsChange={(tags) => onTagsChange?.(client.id, tags)}
        />
      </section>
    </div>,
    document.body
  );
}
