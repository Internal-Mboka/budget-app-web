"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/atoms/logo";
import { PasswordInput } from "@/components/atoms/password-input";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { resetPasswordWithTokenAction } from "@/lib/actions/password";
import {
  mbokaEyebrowClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
  mbokaSubmitButtonClassName,
  mbokaSubtitleClassName,
  mbokaTitleClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("token", token);

    const result = await resetPasswordWithTokenAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Mot de passe réinitialisé.");
    router.push(result.redirectTo ?? "/login");
  }

  if (!token) {
    return (
      <div className="relative min-h-screen bg-[image:var(--mboka-gradient)] px-4 py-10 text-[#10579F] dark:text-sky-100">
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
          <section className={cn("w-full p-6 text-center sm:p-8", mbokaPanelClassName)}>
            <p className="text-sm text-rose-600">Lien de réinitialisation invalide.</p>
            <Link href="/login/forgot-password" className="mt-4 inline-block text-sm font-medium hover:underline">
              Demander un nouveau lien
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[image:var(--mboka-gradient)] px-4 py-10 text-[#10579F] sm:px-6 lg:px-8 dark:text-sky-100">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <section className={cn("w-full p-6 sm:p-8", mbokaPanelClassName)}>
          <Logo variant="auth" />

          <div className="mt-6 text-center">
            <p className={mbokaEyebrowClassName}>Sécurité</p>
            <h1 className={cn("mt-3", mbokaTitleClassName)}>Nouveau mot de passe</h1>
            <p className={cn("mt-3", mbokaSubtitleClassName)}>
              Choisissez un mot de passe fort pour sécuriser votre compte.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

            <button type="submit" className={mbokaSubmitButtonClassName} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
