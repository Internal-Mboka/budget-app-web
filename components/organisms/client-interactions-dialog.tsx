"use client";

import { useEffect, useState } from "react";

import { MbokaDialog } from "@/components/molecules/mboka-dialog";
import { ClientInteractionsPanel } from "@/components/organisms/client-interactions-panel";
import { getClientNotesAction, type ClientNoteItem } from "@/lib/actions/client-notes";
import { buildPaginationMeta } from "@/lib/pagination";

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
  const [notes, setNotes] = useState<ClientNoteItem[]>([]);
  const [pagination, setPagination] = useState(buildPaginationMeta(0, 1, 10));
  const [isLoading, setIsLoading] = useState(false);

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

  if (!client) {
    return null;
  }

  return (
    <MbokaDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Interactions — ${client.name}`}
      description="Suivi des échanges et décisions commerciales."
      size="md"
      testId="client-interactions-dialog"
      backdropTestId="client-interactions-backdrop"
    >
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
    </MbokaDialog>
  );
}
