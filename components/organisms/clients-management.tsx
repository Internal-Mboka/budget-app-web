"use client";

import { MessageSquareText, Pencil, Plus, Tag, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import { ClientTagBadge } from "@/components/molecules/client-tag-badge";
import { ClientEditDialog } from "@/components/organisms/client-edit-dialog";
import { ClientInteractionsDialog } from "@/components/organisms/client-interactions-dialog";
import type { ClientEditData } from "@/components/organisms/client-edit-form";
import { ClientTagFilter } from "@/components/organisms/client-tag-filter";
import { ClientTagsDialog } from "@/components/organisms/client-tags-dialog";
import { buildClientsListHref } from "@/lib/clients/list-url";
import type { PaginationMeta } from "@/lib/pagination";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { getClientCategoryLabel } from "@/lib/clients/categories";
import { cn } from "@/lib/utils";

export type ClientListItem = {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
};

type ClientsManagementProps = {
  initialClients: ClientListItem[];
  pagination: PaginationMeta;
  selectedTags: string[];
  availableTags: string[];
  canViewDetail?: boolean;
  canEditClient?: boolean;
};

function sortClients(clients: ClientListItem[]) {
  return [...clients].sort((a, b) => a.name.localeCompare(b.name));
}

export function ClientsManagement({
  initialClients,
  pagination,
  selectedTags,
  availableTags,
  canViewDetail = false,
  canEditClient = false,
}: ClientsManagementProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [editingClient, setEditingClient] = useState<ClientEditData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taggingClient, setTaggingClient] = useState<ClientListItem | null>(null);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [notesClient, setNotesClient] = useState<{ id: string; name: string } | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  function handleTagFilterChange(tags: string[]) {
    router.push(buildClientsListHref({ page: 1, pageSize: pagination.pageSize, tags }));
  }

  function handleOpenEdit(client: ClientListItem) {
    setEditingClient({
      id: client.id,
      name: client.name,
      category: client.category,
      phone: client.phone,
      email: client.email,
      address: client.address,
      notes: client.notes,
    });
    setEditDialogOpen(true);
  }

  function handleClientUpdated(updatedClient: ClientEditData) {
    setClients((current) =>
      sortClients(
        current.map((client) =>
          client.id === updatedClient.id
            ? {
                ...client,
                name: updatedClient.name,
                category: updatedClient.category,
                phone: updatedClient.phone,
                email: updatedClient.email,
                address: updatedClient.address,
                notes: updatedClient.notes,
              }
            : client
        )
      )
    );
    router.refresh();
  }

  function handleOpenTags(client: ClientListItem) {
    setTaggingClient(client);
    setTagsDialogOpen(true);
  }

  function handleTagsChange(clientId: string, tags: string[]) {
    setClients((current) =>
      sortClients(
        current.map((client) => (client.id === clientId ? { ...client, tags } : client))
      )
    );
    setTaggingClient((current) => (current?.id === clientId ? { ...current, tags } : current));
  }

  function handleOpenNotes(client: ClientListItem) {
    setNotesClient({ id: client.id, name: client.name });
    setNotesDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {availableTags.length > 0 ? (
        <ClientTagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onChange={handleTagFilterChange}
        />
      ) : null}

      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
            Clients enregistrés ({pagination.total}
            {selectedTags.length > 0 ? " filtrés" : ""})
          </h2>

          {canEditClient ? (
            <Link
              href="/clients/new"
              data-testid="client-new-link"
              className={cn(mbokaButtonPrimaryClassName, "no-underline")}
            >
              <Plus className="size-4" />
              Nouveau client
            </Link>
          ) : null}
        </div>

        {clients.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pagination.total === 0 && selectedTags.length === 0 ? (
              <>
                Aucun client pour le moment.{" "}
                {canEditClient ? (
                  <Link href="/clients/new" className="font-medium text-[#10579F] hover:underline dark:text-sky-300">
                    Créez le premier client
                  </Link>
                ) : null}
                .
              </>
            ) : (
              "Aucun client ne correspond aux critères sélectionnés."
            )}
          </p>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <article
                key={client.id}
                data-testid={`client-row-${client.id}`}
                className="rounded-2xl border border-sky-100 bg-white/80 px-3 py-3 dark:border-sky-900 dark:bg-slate-900/50 sm:flex sm:items-center sm:gap-4 sm:px-4 sm:py-3.5"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] sm:size-11 dark:bg-slate-800 dark:text-sky-50">
                    <UsersRound className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {canViewDetail && !client.id.startsWith("optimistic-") ? (
                        <Link
                          href={`/clients/${client.id}`}
                          data-testid={`client-detail-link-${client.id}`}
                          className="text-sm font-semibold break-words text-[#10579F] hover:underline dark:text-sky-50"
                        >
                          {client.name}
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold break-words text-[#10579F] dark:text-sky-50">
                          {client.name}
                        </h3>
                      )}
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-[#10579F] dark:bg-sky-950/40 dark:text-sky-300">
                        {getClientCategoryLabel(client.category)}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {[client.phone, client.email].filter(Boolean).join(" · ") || "Aucun contact renseigné"}
                    </p>

                    {client.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {client.tags.map((tag) => (
                          <ClientTagBadge key={tag} tag={tag} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {canEditClient && !client.id.startsWith("optimistic-") ? (
                  <div
                    className="mt-3 grid grid-cols-3 gap-1.5 border-t border-sky-100 pt-3 sm:mt-0 sm:flex sm:w-auto sm:shrink-0 sm:items-center sm:justify-end sm:border-0 sm:pt-0 sm:pl-0"
                    data-testid={`client-row-actions-${client.id}`}
                  >
                    <button
                      type="button"
                      data-testid={`client-notes-button-${client.id}`}
                      aria-label={`Notes de ${client.name}`}
                      title="Notes"
                      className={cn(
                        mbokaButtonOutlineClassName,
                        "justify-center px-2 py-2 text-[11px] sm:px-3"
                      )}
                      onClick={() => handleOpenNotes(client)}
                    >
                      <MessageSquareText className="size-3.5" />
                      Notes
                    </button>
                    <button
                      type="button"
                      data-testid={`client-tags-button-${client.id}`}
                      aria-label={`Tags de ${client.name}`}
                      title="Tags"
                      className={cn(
                        mbokaButtonOutlineClassName,
                        "justify-center px-2 py-2 text-[11px] sm:px-3"
                      )}
                      onClick={() => handleOpenTags(client)}
                    >
                      <Tag className="size-3.5" />
                      Tags
                    </button>
                    <button
                      type="button"
                      data-testid={`client-edit-button-${client.id}`}
                      aria-label={`Modifier ${client.name}`}
                      title="Modifier"
                      className={cn(
                        mbokaButtonOutlineClassName,
                        "justify-center px-2 py-2 text-[11px] sm:px-3"
                      )}
                      onClick={() => handleOpenEdit(client)}
                    >
                      <Pencil className="size-3.5" />
                      Modifier
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}

        <MbokaPagination
          meta={pagination}
          buildHref={(page, pageSize) =>
            buildClientsListHref({ page, pageSize: pageSize ?? pagination.pageSize, tags: selectedTags })
          }
        />
      </section>

      <ClientEditDialog
        client={editingClient}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdated={handleClientUpdated}
      />

      <ClientTagsDialog
        client={taggingClient}
        open={tagsDialogOpen}
        onOpenChange={setTagsDialogOpen}
        onTagsChange={handleTagsChange}
      />

      <ClientInteractionsDialog
        client={notesClient}
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
      />
    </div>
  );
}
