import { ChangePasswordForm } from "@/components/organisms/change-password-form";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AccountPasswordPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  const requireCurrentPassword = !user?.mustChangePassword;

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Compte"
        title="Mot de passe"
        description={
          requireCurrentPassword
            ? "Modifiez votre mot de passe. Une notification de sécurité vous sera envoyée."
            : "Pour votre sécurité, définissez un nouveau mot de passe avant d'accéder à l'application."
        }
      />

      <section className={cn(mbokaPanelClassName, "max-w-xl p-6 sm:p-8")}>
        <ChangePasswordForm requireCurrentPassword={requireCurrentPassword} />
      </section>
    </div>
  );
}
