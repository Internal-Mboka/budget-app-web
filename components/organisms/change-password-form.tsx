"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/atoms/password-input";
import { changePasswordAction } from "@/lib/actions/password";
import {
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ChangePasswordFormProps = {
  requireCurrentPassword: boolean;
};

export function ChangePasswordForm({ requireCurrentPassword }: ChangePasswordFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("requireCurrentPassword", String(requireCurrentPassword));

    const result = await changePasswordAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Mot de passe mis à jour. Reconnectez-vous.");
    router.push(result.redirectTo ?? "/login");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {requireCurrentPassword ? (
        <div>
          <label htmlFor="currentPassword" className={mbokaLabelClassName}>
            Mot de passe actuel
          </label>
          <PasswordInput id="currentPassword" name="currentPassword" required />
        </div>
      ) : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Première connexion : choisissez un nouveau mot de passe personnel.
        </p>
      )}

      <div>
        <label htmlFor="newPassword" className={mbokaLabelClassName}>
          Nouveau mot de passe
        </label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          required
          placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={mbokaLabelClassName}>
          Confirmer le mot de passe
        </label>
        <PasswordInput id="confirmPassword" name="confirmPassword" required />
      </div>

      <button type="submit" className={mbokaButtonPrimaryClassName} disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          "Enregistrer le mot de passe"
        )}
      </button>
    </form>
  );
}
