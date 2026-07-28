import { AccountProfilePanel } from "@/components/organisms/account-profile-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { getAccountProfileDisplayName, loadAccountProfile } from "@/lib/account/load-profile";
import { requireSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";

export default async function AccountProfilePage() {
  const session = await requireSession();
  const profile = await loadAccountProfile(session.user.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Compte"
        title="Mon profil"
        description={`Bonjour ${getAccountProfileDisplayName(profile)} — consultez vos informations et accédez aux paramètres de sécurité.`}
      />

      <AccountProfilePanel profile={profile} />
    </div>
  );
}
