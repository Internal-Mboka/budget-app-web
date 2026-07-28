"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MbokaDialog } from "@/components/molecules/mboka-dialog";
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
} from "@/lib/design-tokens";

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

  useEffect(() => {
    if (!open) {
      return;
    }

    setCategory(CLIENT_CATEGORY_OPTIONS[0]?.value ?? "");
  }, [open]);

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

  return (
    <MbokaDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouveau client rapide"
      description="Créez un client sans quitter la saisie en cours."
      size="sm"
      testId="client-quick-create-dialog"
      backdropTestId="client-quick-create-backdrop"
    >
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
    </MbokaDialog>
  );
}
