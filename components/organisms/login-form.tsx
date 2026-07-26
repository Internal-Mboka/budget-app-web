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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/actions/auth";

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

    if (result?.error) {
      toast.error("Identifiants incorrects ou compte désactivé.");
      setIsSubmitting(false);
      return;
    }

    toast.success("Connexion réussie.");
    router.push(result?.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_48%,#ffffff_100%)] px-4 py-10 dark:bg-[linear-gradient(180deg,#0a1628_0%,#0f1d32_48%,#0a1628_100%)]">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full rounded-4xl border-sky-100/80 bg-white/90 shadow-[0_20px_60px_rgba(16,87,159,0.10)] backdrop-blur dark:border-sky-900 dark:bg-slate-900/90">
          <CardHeader className="items-center text-center">
            <Logo size="lg" className="mb-2" />
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-400">Mboka Budget</p>
            <CardTitle className="text-3xl text-primary">Connexion</CardTitle>
            <CardDescription>
              Accédez à votre espace sécurisé selon votre rôle et vos permissions.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {initialError === "forbidden" ? (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                Accès refusé. Connectez-vous avec un compte autorisé.
              </p>
            ) : null}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nom@exemple.com"
                    {...form.register("email")}
                  />
                  <FieldError errors={[form.formState.errors.email]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />
                  <FieldError errors={[form.formState.errors.password]} />
                </Field>
              </FieldGroup>

              <Button type="submit" className="w-full rounded-2xl" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
