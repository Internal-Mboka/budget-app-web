import { AppShell } from "@/components/templates/app-shell";
import { requireSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return <AppShell user={session.user}>{children}</AppShell>;
}
