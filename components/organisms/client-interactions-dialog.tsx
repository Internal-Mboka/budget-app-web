"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ClientInteractionsPanel } from "@/components/organisms/client-interactions-panel";
import { getClientNotesAction, type ClientNoteItem } from "@/lib/actions/client-notes";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { buildPaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type ClientInteractionsDialogProps = {
  open: boolean;
  client: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
};

export function ClientInteractionsDialog({
  open,
  client,
  onOpenChange,
}: ClientInteractionsDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<ClientNoteItem[]>([]);
  const [pagination, setPagination] = useState(buildPaginationMeta(0, 1, 10));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !client) {
      return;
    }

    setIsLoading(true);
    void getClientNotesAction(client.id, 1, 10)
      .then((result) => {
        setNotes(result.notes);
        setPagination(result.pagination);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, client]);

  if (!open || !client || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      data-testid="client-interactions-backdrop"
      onClick={() => onOpenChange(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-interactions-title"
        data-testid="client-interactions-dialog"
        className={cn(mbokaPanelClassName, "max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="client-interactions-title" className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Interactions — {client.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Suivi des échanges et décisions commerciales.
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

        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>
        ) : (
          <ClientInteractionsPanel
            clientId={client.id}
            initialNotes={notes}
            pagination={pagination}
            buildNotesHref={() => "#"}
            canAddNote
            showPagination={false}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        )}
      </section>
    </div>,
    document.body
  );
}
