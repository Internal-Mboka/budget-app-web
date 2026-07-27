import { AppShell } from "@/components/templates/app-shell";
import { FiscalPeriodSetupBanner } from "@/components/molecules/fiscal-period-setup-banner";
import { requireSession } from "@/lib/auth/session";
import { canInitializeFiscalPeriod } from "@/lib/fiscal-period/can-initialize";
import { requiresFiscalPeriodSetup } from "@/lib/fiscal-period/load-fiscal-periods";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const needsFiscalPeriodSetup = await requiresFiscalPeriodSetup();
  const showFiscalPeriodSetupNav =
    needsFiscalPeriodSetup && canInitializeFiscalPeriod(session.user.roleName);

  return (
    <AppShell user={session.user} showFiscalPeriodSetupNav={showFiscalPeriodSetupNav}>
      {needsFiscalPeriodSetup ? <FiscalPeriodSetupBanner roleName={session.user.roleName} /> : null}
      {children}
    </AppShell>
  );
}
