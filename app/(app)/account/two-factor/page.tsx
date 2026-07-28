import { redirect } from "next/navigation";

import { TwoFactorSettings } from "@/components/organisms/two-factor-settings";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountTwoFactorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Compte"
        title="Authentification 2FA"
        description="Activez un code TOTP via QR code pour sécuriser votre connexion."
      />

      <TwoFactorSettings enabled={user?.twoFactorEnabled ?? false} />
    </div>
  );
}
