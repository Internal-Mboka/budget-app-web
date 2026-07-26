"use client";

import { Loader2, Pencil, Tag, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { ClientTagBadge } from "@/components/molecules/client-tag-badge";
import { ClientEditDialog } from "@/components/organisms/client-edit-dialog";
import type { ClientEditData } from "@/components/organisms/client-edit-form";
import { ClientTagFilter } from "@/components/organisms/client-tag-filter";
import { ClientTagsDialog } from "@/components/organisms/client-tags-dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClientAction } from "@/lib/actions/clients";
import { CLIENT_CATEGORY_OPTIONS, getClientCategoryLabel } from "@/lib/clients/categories";
import { clientMatchesTagFilter, collectDistinctTags } from "@/lib/clients/tags";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
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
  canViewDetail?: boolean;
  canEditClient?: boolean;
};

const categoryOptions = CLIENT_CATEGORY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

function sortClients(clients: ClientListItem[]) {
  return [...clients].sort((a, b) => a.name.localeCompare(b.name));
}

export function ClientsManagement({
  initialClients,
  canViewDetail = false,
  canEditClient = false,
}: ClientsManagementProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [isCreating, setIsCreating] = useState(false);
  const [category, setCategory] = useState<string>(CLIENT_CATEGORY_OPTIONS[0]?.value ?? "");
  const [editingClient, setEditingClient] = useState<ClientEditData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taggingClient, setTaggingClient] = useState<ClientListItem | null>(null);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = collectDistinctTags(clients);
  const filteredClients = clients.filter((client) =>
    clientMatchesTagFilter(client.tags, selectedTags)
  );

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("category", category);

    if (!category) {
      toast.error("Veuillez sélectionner une catégorie.");
      setIsCreating(false);
      return;
    }

    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticClient: ClientListItem = {
      id: tempId,
      name: String(formData.get("name") ?? ""),
      category,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      address: null,
      notes: null,
      tags: [],
      createdAt: new Date().toISOString(),
    };

    setClients((current) => sortClients([...current, optimisticClient]));

    const result = await createClientAction(formData);

    if (!result.success) {
      setClients((current) => current.filter((client) => client.id !== tempId));
      toast.error(result.error);
      setIsCreating(false);
      return;
    }

    setClients((current) =>
      sortClients(
        current.map((client) =>
          client.id === tempId
            ? {
                id: result.client.id,
                name: result.client.name,
                category: result.client.category,
                phone: result.client.phone,
                email: result.client.email,
                address: result.client.address ?? null,
                notes: result.client.notes ?? null,
                tags: result.client.tags ?? [],
                createdAt: new Date().toISOString(),
              }
            : client
        )
      )
    );

    form.reset();
    setCategory(CLIENT_CATEGORY_OPTIONS[0]?.value ?? "");
    toast.success("Client enregistré.");
    setIsCreating(false);
    router.refresh();
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

  return (
    <div className="space-y-8">
      <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")}>
        <div>
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Nouveau client</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Nom et catégorie obligatoires.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5" data-testid="client-create-form">
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="name" className={mbokaLabelClassName}>
                Nom *
              </FieldLabel>
              <Input
                id="name"
                name="name"
                required
                minLength={2}
                placeholder="Ex. Maisha Music, Jean Mukendi…"
                className={mbokaFieldClassName}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="category" className={mbokaLabelClassName}>
                Catégorie *
              </FieldLabel>
              <MbokaSelect
                id="category"
                name="category"
                value={category}
                onValueChange={setCategory}
                options={categoryOptions}
                placeholder="Sélectionner une catégorie"
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone" className={mbokaLabelClassName}>
                  Téléphone
                </FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+243 …"
                  className={mbokaFieldClassName}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email" className={mbokaLabelClassName}>
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@exemple.com"
                  className={mbokaFieldClassName}
                />
              </Field>
            </div>
          </FieldGroup>

          <button type="submit" className={mbokaButtonPrimaryClassName} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer le client"
            )}
          </button>
        </form>
      </section>

      {availableTags.length > 0 ? (
        <ClientTagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
      ) : null}

      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
          Clients enregistrés ({filteredClients.length}
          {selectedTags.length > 0 ? ` / ${clients.length}` : ""})
        </h2>

        {filteredClients.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {clients.length === 0
              ? "Aucun client pour le moment. Utilisez le formulaire ci-dessus."
              : "Aucun client ne correspond aux tags sélectionnés."}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <article
                key={client.id}
                data-testid={`client-row-${client.id}`}
                className="flex items-start gap-4 rounded-2xl border border-sky-100 bg-white/80 px-4 py-4 dark:border-sky-900 dark:bg-slate-900/50"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
                  <UsersRound className="size-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {canViewDetail && !client.id.startsWith("optimistic-") ? (
                      <Link
                        href={`/clients/${client.id}`}
                        data-testid={`client-detail-link-${client.id}`}
                        className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                      >
                        {client.name}
                      </Link>
                    ) : (
                      <h3 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
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

                <div className="flex shrink-0 flex-col gap-2">
                {canEditClient && !client.id.startsWith("optimistic-") ? (
                  <>
                  <button
                    type="button"
                    data-testid={`client-tags-button-${client.id}`}
                    aria-label={`Tags de ${client.name}`}
                    className={cn(
                      mbokaButtonOutlineClassName,
                      "px-3 py-2 text-xs"
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
                    className={cn(
                      mbokaButtonOutlineClassName,
                      "px-3 py-2 text-xs"
                    )}
                    onClick={() => handleOpenEdit(client)}
                  >
                    <Pencil className="size-3.5" />
                    Modifier
                  </button>
                  </>
                ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
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
    </div>
  );
}
