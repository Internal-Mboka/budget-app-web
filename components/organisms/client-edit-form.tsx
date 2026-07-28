"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateClientAction } from "@/lib/actions/clients";
import { CLIENT_CATEGORY_OPTIONS } from "@/lib/clients/categories";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
} from "@/lib/design-tokens";

export type ClientEditData = {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

type ClientEditFormProps = {
  client: ClientEditData;
  formId?: string;
  onUpdated?: (client: ClientEditData) => void;
  onCancel?: () => void;
  showActions?: boolean;
};

const categoryOptions = CLIENT_CATEGORY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function ClientEditForm({
  client,
  formId = "client-edit-form",
  onUpdated,
  onCancel,
  showActions = true,
}: ClientEditFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState(client.category);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCategory(client.category);
  }, [client.category, client.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("id", client.id);
    formData.set("category", category);

    const result = await updateClientAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsSaving(false);
      return;
    }

    const updatedClient: ClientEditData = {
      id: result.client.id,
      name: result.client.name,
      category: result.client.category,
      phone: result.client.phone,
      email: result.client.email,
      address: result.client.address ?? null,
      notes: result.client.notes ?? null,
    };

    toast.success("Fiche client mise à jour.");
    onUpdated?.(updatedClient);
    router.refresh();
    setIsSaving(false);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5" data-testid="client-edit-form">
      <input type="hidden" name="id" value={client.id} />

      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor={`${formId}-name`} className={mbokaLabelClassName}>
            Nom *
          </FieldLabel>
          <Input
            id={`${formId}-name`}
            name="name"
            required
            minLength={2}
            defaultValue={client.name}
            className={mbokaFieldClassName}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-category`} className={mbokaLabelClassName}>
            Catégorie *
          </FieldLabel>
          <MbokaSelect
            id={`${formId}-category`}
            name="category"
            value={category}
            onValueChange={setCategory}
            options={categoryOptions}
            required
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${formId}-phone`} className={mbokaLabelClassName}>
              Téléphone
            </FieldLabel>
            <Input
              id={`${formId}-phone`}
              name="phone"
              type="tel"
              defaultValue={client.phone ?? ""}
              className={mbokaFieldClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={`${formId}-email`} className={mbokaLabelClassName}>
              Email
            </FieldLabel>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
              className={mbokaFieldClassName}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor={`${formId}-address`} className={mbokaLabelClassName}>
            Adresse
          </FieldLabel>
          <Input
            id={`${formId}-address`}
            name="address"
            defaultValue={client.address ?? ""}
            className={mbokaFieldClassName}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-notes`} className={mbokaLabelClassName}>
            Notes internes
          </FieldLabel>
          <textarea
            id={`${formId}-notes`}
            name="notes"
            rows={4}
            defaultValue={client.notes ?? ""}
            placeholder="Accords commerciaux, préférences, consignes de facturation…"
            className={mbokaFieldClassName}
          />
        </Field>
      </FieldGroup>

      {showActions ? (
        <div className="flex flex-wrap justify-end gap-3">
          {onCancel ? (
            <button type="button" className={mbokaButtonOutlineClassName} onClick={onCancel}>
              Annuler
            </button>
          ) : null}
          <button type="submit" className={mbokaButtonPrimaryClassName} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </button>
        </div>
      ) : null}
    </form>
  );
}
