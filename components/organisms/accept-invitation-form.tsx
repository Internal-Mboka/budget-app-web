"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/atoms/logo";
import { PasswordInput } from "@/components/atoms/password-input";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { acceptInvitationAction } from "@/lib/actions/invitations";
import { INVITE_TOKEN_TTL_DAYS } from "@/lib/invitations/constants";
import { formatInvitationExpiryLabel } from "@/lib/invitations/format-expiry";
import type { InvitationPreview } from "@/lib/invitations/service";
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

type AcceptInvitationFormProps = {
  token: string;
  preview: InvitationPreview | null;
};

export function AcceptInvitationForm({ token, preview }: AcceptInvitationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("token", token);

    const result = await acceptInvitationAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Compte activé. Connexion en cours…");
    router.push(result.redirectTo);
  }

  if (!token || !preview) {
    return (
      <div className="relative min-h-screen bg-[image:var(--mboka-gradient)] px-4 py-10 text-[#10579F] dark:text-sky-100">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
          <section className={cn("w-full p-6 text-center sm:p-8", mbokaPanelClassName)}>
            <p className="text-sm text-rose-600 dark:text-rose-400">
              Lien d&apos;invitation invalide ou expiré.
            </p>
            <Link href="/login" className="mt-4 inline-block text-sm font-medium hover:underline">
              Retour à la connexion
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
            <p className={mbokaEyebrowClassName}>Invitation</p>
            <h1 className={cn("mt-3", mbokaTitleClassName)}>Activez votre compte</h1>
            <p className={cn("mt-3", mbokaSubtitleClassName)}>
              {preview.inviterName} vous invite à rejoindre Mboka Budget en tant que{" "}
              <strong>{preview.roleLabel}</strong>.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ce lien expire le {formatInvitationExpiryLabel(preview.expiresAt)} ({INVITE_TOKEN_TTL_DAYS}{" "}
              jours).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="firstName" className={mbokaLabelClassName}>
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                value={preview.firstName}
                readOnly
                className={cn(mbokaFieldClassName, "cursor-not-allowed opacity-80")}
              />
            </div>

            <div>
              <label htmlFor="lastName" className={mbokaLabelClassName}>
                Nom
              </label>
              <input
                id="lastName"
                name="lastName"
                value={preview.lastName}
                readOnly
                className={cn(mbokaFieldClassName, "cursor-not-allowed opacity-80")}
              />
            </div>

            <div>
              <label htmlFor="email" className={mbokaLabelClassName}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={preview.email}
                readOnly
                className={cn(mbokaFieldClassName, "cursor-not-allowed opacity-80")}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                L&apos;invitation a été envoyée à cette adresse.
              </p>
            </div>

            <div>
              <label htmlFor="newPassword" className={mbokaLabelClassName}>
                Choisissez votre mot de passe
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
                  Activation...
                </>
              ) : (
                "Activer mon compte"
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
