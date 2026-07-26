"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/atoms/logo";
import { ThemeToggle } from "@/components/atoms/theme-toggle";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/actions/auth";
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

const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  callbackUrl?: string;
  initialError?: string;
};

export function LoginForm({ callbackUrl, initialError }: LoginFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    if (callbackUrl) {
      formData.set("callbackUrl", callbackUrl);
    }

    const result = await loginAction(formData);

    if (result?.error === "invalid-credentials") {
      toast.error("Identifiants incorrects ou compte désactivé.");
      setIsSubmitting(false);
      return;
    }

    if (result?.error === "server-error") {
      toast.error("Erreur serveur. Réessayez dans quelques instants.");
      setIsSubmitting(false);
      return;
    }

    toast.success("Connexion réussie.");
    router.push(result?.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <div
      className="relative min-h-screen bg-[image:var(--mboka-gradient)] px-4 py-10 text-[#10579F] sm:px-6 lg:px-8 dark:text-sky-100"
    >
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <section className={cn("w-full p-6 sm:p-8", mbokaPanelClassName)}>
          <Logo variant="auth" />

          <div className="mt-6 text-center">
            <p className={mbokaEyebrowClassName}>Bienvenue</p>
            <h1 className={cn("mt-3", mbokaTitleClassName)}>Connexion</h1>
            <p className={cn("mt-3", mbokaSubtitleClassName)}>Accédez à votre espace Mboka Budget.</p>
          </div>

          {initialError === "forbidden" ? (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              Accès refusé. Connectez-vous avec un compte autorisé.
            </p>
          ) : null}

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="email" className={mbokaLabelClassName}>
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nom@exemple.com"
                  className={mbokaFieldClassName}
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className={mbokaLabelClassName}>
                  Mot de passe
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={mbokaFieldClassName}
                  {...form.register("password")}
                />
                <FieldError errors={[form.formState.errors.password]} />
              </Field>
            </FieldGroup>

            <button type="submit" className={mbokaSubmitButtonClassName} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
