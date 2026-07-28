"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/atoms/logo";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/lib/actions/password";
import {
  mbokaEyebrowClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
  mbokaSubmitButtonClassName,
  mbokaSubtitleClassName,
  mbokaTitleClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await requestPasswordResetAction(new FormData(event.currentTarget));

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Si un compte existe, un email de réinitialisation a été envoyé.");
    router.push(result.redirectTo ?? "/login");
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
            <h1 className={cn("mt-3", mbokaTitleClassName)}>Mot de passe oublié</h1>
            <p className={cn("mt-3", mbokaSubtitleClassName)}>
              Saisissez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="email" className={mbokaLabelClassName}>
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nom@exemple.com"
                  className={mbokaFieldClassName}
                />
              </Field>
            </FieldGroup>

            <button type="submit" className={mbokaSubmitButtonClassName} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer le lien"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="font-medium text-[#10579F] hover:underline dark:text-sky-300">
              Retour à la connexion
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
