"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClientAction } from "@/lib/actions/clients";
import { CLIENT_CATEGORY_OPTIONS } from "@/lib/clients/categories";
import type { ClientSearchResult } from "@/lib/clients/search";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ClientQuickCreateDialogProps = {
  open: boolean;
  defaultName?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: ClientSearchResult) => void;
};

const categoryOptions = CLIENT_CATEGORY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function ClientQuickCreateDialog({
  open,
  defaultName = "",
  onOpenChange,
  onCreated,
}: ClientQuickCreateDialogProps) {
  const [category, setCategory] = useState<string>(CLIENT_CATEGORY_OPTIONS[0]?.value ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCategory(CLIENT_CATEGORY_OPTIONS[0]?.value ?? "");
  }, [open]);

  if (!open || !mounted) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("category", category);

    const result = await createClientAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsCreating(false);
      return;
    }

    toast.success("Client créé et sélectionné.");
    onCreated(result.client);
    onOpenChange(false);
    form.reset();
    setIsCreating(false);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      data-testid="client-quick-create-backdrop"
      onClick={() => onOpenChange(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-quick-create-title"
        data-testid="client-quick-create-dialog"
        className={cn(mbokaPanelClassName, "w-full max-w-lg space-y-5 p-5 sm:p-6")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="client-quick-create-title"
              className="text-base font-semibold text-[#10579F] dark:text-sky-50"
            >
              Nouveau client rapide
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Créez un client sans quitter la saisie en cours.
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

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          data-testid="client-quick-create-form"
        >
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="quickClientName" className={mbokaLabelClassName}>
                Nom *
              </FieldLabel>
              <Input
                id="quickClientName"
                name="name"
                required
                minLength={2}
                defaultValue={defaultName}
                className={mbokaFieldClassName}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="quickClientCategory" className={mbokaLabelClassName}>
                Catégorie *
              </FieldLabel>
              <MbokaSelect
                id="quickClientCategory"
                name="category"
                value={category}
                onValueChange={setCategory}
                options={categoryOptions}
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="quickClientPhone" className={mbokaLabelClassName}>
                  Téléphone
                </FieldLabel>
                <Input
                  id="quickClientPhone"
                  name="phone"
                  type="tel"
                  className={mbokaFieldClassName}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="quickClientEmail" className={mbokaLabelClassName}>
                  Email
                </FieldLabel>
                <Input
                  id="quickClientEmail"
                  name="email"
                  type="email"
                  className={mbokaFieldClassName}
                />
              </Field>
            </div>
          </FieldGroup>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={mbokaButtonOutlineClassName}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </button>
            <button type="submit" className={mbokaButtonPrimaryClassName} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer et sélectionner"
              )}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
