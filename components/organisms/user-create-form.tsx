"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createUserAction } from "@/lib/actions/users";
import {
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
  ROLE_LABELS,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RoleOption = {
  id: number;
  name: string;
};

type UserCreateFormProps = {
  roles: RoleOption[];
};

export function UserCreateForm({ roles }: UserCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await createUserAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Utilisateur créé avec succès.");
    event.currentTarget.reset();
    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <section className={cn(mbokaPanelClassName, "p-6 sm:p-8")}>
      <h2 className="text-lg font-semibold text-[#10579F] dark:text-sky-50">Nouveau compte</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Créez un utilisateur et assignez-lui un rôle.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="firstName" className={mbokaLabelClassName}>
              Prénom
            </FieldLabel>
            <Input id="firstName" name="firstName" required className={cn(mbokaFieldClassName, "h-auto min-h-12")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName" className={mbokaLabelClassName}>
              Nom
            </FieldLabel>
            <Input id="lastName" name="lastName" required className={cn(mbokaFieldClassName, "h-auto min-h-12")} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="email" className={mbokaLabelClassName}>
              Email
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="nom@exemple.com"
              className={cn(mbokaFieldClassName, "h-auto min-h-12")}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="password" className={mbokaLabelClassName}>
              Mot de passe temporaire
            </FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
              className={cn(mbokaFieldClassName, "h-auto min-h-12")}
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="roleId" className={mbokaLabelClassName}>
              Rôle
            </FieldLabel>
            <select
              id="roleId"
              name="roleId"
              required
              defaultValue={roles.find((role) => role.name === "OBSERVATEUR")?.id ?? roles[0]?.id}
              className={cn(mbokaFieldClassName, "h-auto min-h-12")}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {ROLE_LABELS[role.name] ?? role.name}
                </option>
              ))}
            </select>
          </Field>
        </FieldGroup>

        <Button type="submit" className={mbokaButtonPrimaryClassName} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Création...
            </>
          ) : (
            "Créer l'utilisateur"
          )}
        </Button>
      </form>
    </section>
  );
}
