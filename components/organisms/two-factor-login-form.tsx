"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/atoms/logo";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { completeTwoFactorLoginAction } from "@/lib/actions/auth";
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

type TwoFactorLoginFormProps = {
  email?: string | null;
};

export function TwoFactorLoginForm({ email }: TwoFactorLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("code", code);

    if (callbackUrl) {
      formData.set("callbackUrl", callbackUrl);
    }

    const result = await completeTwoFactorLoginAction(formData);

    if (result.error === "invalid-code") {
      toast.error("Code incorrect. Réessayez.");
      setIsSubmitting(false);
      return;
    }

    if (result.error === "challenge-expired") {
      toast.error("Session expirée. Reconnectez-vous.");
      router.push("/login");
      return;
    }

    if (result.error) {
      toast.error("Erreur serveur. Réessayez dans quelques instants.");
      setIsSubmitting(false);
      return;
    }

    toast.success("Connexion réussie.");
    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen bg-[image:var(--mboka-gradient)] px-4 py-10 text-[#10579F] sm:px-6 lg:px-8 dark:text-sky-100">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <section className={cn("w-full p-6 sm:p-8", mbokaPanelClassName)}>
          <Logo variant="auth" />

          <div className="mt-6 text-center">
            <p className={mbokaEyebrowClassName}>Sécurité</p>
            <h1 className={cn("mt-3", mbokaTitleClassName)}>Vérification 2FA</h1>
            <p className={cn("mt-3", mbokaSubtitleClassName)}>
              Saisissez le code à 6 chiffres de votre application Authenticator
              {email ? ` pour ${email}` : ""}.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" data-testid="two-factor-login-form">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="code" className={mbokaLabelClassName}>
                  Code OTP
                </FieldLabel>
                <Input
                  id="code"
                  data-testid="two-factor-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  className={cn(mbokaFieldClassName, "text-center text-lg tracking-[0.3em]")}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  required
                />
              </Field>
            </FieldGroup>

            <button type="submit" className={mbokaSubmitButtonClassName} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Valider"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <Link href="/login" className="font-medium text-sky-500 hover:underline dark:text-sky-400">
              Retour à la connexion
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
