"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClientAction } from "@/lib/actions/clients";
import { useFormAutofocus } from "@/hooks/use-form-shortcuts";
import { CLIENT_CATEGORY_OPTIONS } from "@/lib/clients/categories";
import {
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const categoryOptions = CLIENT_CATEGORY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

type ClientCreateFormProps = {
  redirectTo?: string;
};

export function ClientCreateForm({ redirectTo = "/clients" }: ClientCreateFormProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [category, setCategory] = useState<string>(CLIENT_CATEGORY_OPTIONS[0]?.value ?? "");

  useFormAutofocus(sectionRef);

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

    const result = await createClientAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsCreating(false);
      return;
    }

    toast.success("Client enregistré.");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <section ref={sectionRef} className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")}>
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
              data-form-autofocus="true"
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
  );
}
