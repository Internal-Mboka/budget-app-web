import { AppShell } from "@/components/templates/app-shell";
import { FiscalPeriodSetupBanner } from "@/components/molecules/fiscal-period-setup-banner";
import { requireSession } from "@/lib/auth/session";
import { requiresFiscalPeriodSetup } from "@/lib/fiscal-period/load-fiscal-periods";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const needsFiscalPeriodSetup = await requiresFiscalPeriodSetup();

  return (
    <AppShell user={session.user}>
      {needsFiscalPeriodSetup ? <FiscalPeriodSetupBanner roleName={session.user.roleName} /> : null}
      {children}
    </AppShell>
  );
}
