"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  ClientEditForm,
  type ClientEditData,
} from "@/components/organisms/client-edit-form";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ClientEditDialogProps = {
  client: ClientEditData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (client: ClientEditData) => void;
};

export function ClientEditDialog({
  client,
  open,
  onOpenChange,
  onUpdated,
}: ClientEditDialogProps) {
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
      data-testid="client-edit-backdrop"
      onClick={() => onOpenChange(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-edit-title"
        data-testid="client-edit-dialog"
        className={cn(mbokaPanelClassName, "max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="client-edit-title" className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Modifier la fiche client
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Mettez à jour les coordonnées et les notes sans affecter l&apos;historique financier.
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

        <ClientEditForm
          client={client}
          formId="client-edit-dialog-form"
          onUpdated={(updatedClient) => {
            onUpdated?.(updatedClient);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </section>
    </div>,
    document.body
  );
}
