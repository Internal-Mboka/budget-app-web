import { ActiveSessionsPanel } from "@/components/organisms/active-sessions-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { auth } from "@/lib/auth";
import { paginateArray, parsePagination } from "@/lib/pagination";
import { listUserSessions } from "@/lib/sessions/service";

type AccountSessionsPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function AccountSessionsPage({ searchParams }: AccountSessionsPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const params = await searchParams;
  const pagination = parsePagination(params);
  const allSessions = await listUserSessions(session.user.id);
  const { rows: sessions, meta: paginationMeta } = paginateArray(
    allSessions,
    pagination.page,
    pagination.pageSize
  );

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
        pagination={paginationMeta}
      />
    </div>
  );
}
