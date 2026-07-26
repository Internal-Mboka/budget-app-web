import { ActiveSessionsPanel } from "@/components/organisms/active-sessions-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { auth } from "@/lib/auth";
import { listUserSessions } from "@/lib/sessions/service";

export default async function AccountSessionsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const sessions = await listUserSessions(session.user.id);

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Compte"
        title="Sessions actives"
        description="Consultez les appareils connectés à votre compte et révoquez les accès distants."
      />

      <ActiveSessionsPanel
        initialSessions={sessions}
        currentSessionId={session.user.sessionId}
      />
    </div>
  );
}
