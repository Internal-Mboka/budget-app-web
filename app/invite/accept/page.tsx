import { AcceptInvitationForm } from "@/components/organisms/accept-invitation-form";
import { loadInvitationPreview } from "@/lib/invitations/service";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const preview = token ? await loadInvitationPreview(token) : null;

  return <AcceptInvitationForm token={token} preview={preview} />;
}
