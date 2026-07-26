"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import { addClientNoteAction, type ClientNoteItem } from "@/lib/actions/client-notes";
import {
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import type { PaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type ClientInteractionsPanelProps = {
  clientId: string;
  initialNotes: ClientNoteItem[];
  pagination: PaginationMeta;
  buildNotesHref: (page: number, pageSize?: number) => string;
  canAddNote?: boolean;
  showPagination?: boolean;
  className?: string;
};

function NoteDate({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMM yyyy · HH:mm", { locale: fr }));
  }, [isoDate]);

  return (
    <time
      dateTime={isoDate}
      className="text-xs text-slate-500 dark:text-slate-400"
      suppressHydrationWarning
    >
      {label || "—"}
    </time>
  );
}

function NoteCard({ note }: { note: ClientNoteItem }) {
  return (
    <article
      data-testid={`client-note-${note.id}`}
      className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-4 dark:border-sky-900 dark:bg-slate-900/50"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">{note.author.name}</p>
        <NoteDate isoDate={note.createdAt} />
      </div>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
        {note.content}
      </p>
    </article>
  );
}

export function ClientInteractionsPanel({
  clientId,
  initialNotes,
  pagination,
  buildNotesHref,
  canAddNote = false,
  showPagination = true,
  className,
}: ClientInteractionsPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content) {
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("content", content);

    const result = await addClientNoteAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsSaving(false);
      return;
    }

    setNotes((current) => [result.note, ...current]);
    setDraft("");
    toast.success("Note enregistrée.");
    setIsSaving(false);
  }

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6", className)}
      data-testid="client-interactions-section"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
          <MessageSquareText className="size-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
            Historique des interactions
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Notes datées partagées entre l&apos;équipe administrative.
          </p>
        </div>
      </div>

      {canAddNote ? (
        <form onSubmit={handleSubmit} className="space-y-3" data-testid="client-note-form">
          <div className="space-y-2">
            <label htmlFor={`client-note-input-${clientId}`} className={mbokaLabelClassName}>
              Nouvelle note
            </label>
            <textarea
              id={`client-note-input-${clientId}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="Ex. Accord remise 10 % validé, relance effectuée…"
              className={cn(mbokaFieldClassName, "min-h-[96px] resize-y")}
              data-testid="client-note-input"
            />
          </div>
          <button
            type="submit"
            className={mbokaButtonPrimaryClassName}
            disabled={isSaving || !draft.trim()}
            data-testid="client-note-submit"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Ajouter la note"
            )}
          </button>
        </form>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="client-notes-empty">
          Aucune interaction enregistrée pour ce client.
        </p>
      ) : (
        <div className="space-y-3" data-testid="client-notes-list">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      <MbokaPagination meta={pagination} buildHref={buildNotesHref} className={showPagination ? undefined : "hidden"} />
    </section>
  );
}
