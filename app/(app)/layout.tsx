import { AppShell } from "@/components/templates/app-shell";
import { FiscalPeriodClosingBanner } from "@/components/molecules/fiscal-period-closing-banner";
import { FiscalPeriodSetupBanner } from "@/components/molecules/fiscal-period-setup-banner";
import { requireSession } from "@/lib/auth/session";
import { canSeeFiscalClosingBanner } from "@/lib/fiscal-period/banner-access";
import { canInitializeFiscalPeriod } from "@/lib/fiscal-period/can-initialize";
import { canAccessFiscalPeriodClosingPage } from "@/lib/fiscal-period/closing-workflow";
import {
  loadFiscalPeriodInClosing,
  requiresFiscalPeriodSetup,
} from "@/lib/fiscal-period/load-fiscal-periods";
import { syncExpiredFiscalPeriodsToClosing } from "@/lib/fiscal-period/sync-expired-periods";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  await syncExpiredFiscalPeriodsToClosing({ actorUserId: session.user.id });

  const [needsFiscalPeriodSetup, closingPeriod] = await Promise.all([
    requiresFiscalPeriodSetup(),
    loadFiscalPeriodInClosing(),
  ]);
  const showFiscalPeriodSetupNav =
    needsFiscalPeriodSetup && canInitializeFiscalPeriod(session.user.roleName);
  const showClosingBanner =
    closingPeriod !== null && canSeeFiscalClosingBanner(session.user.permissions);
  const showFiscalPeriodClosingNav =
    closingPeriod !== null && canAccessFiscalPeriodClosingPage(session.user.roleName);
  const showClosingBannerLink = showFiscalPeriodClosingNav;

  return (
    <AppShell
      user={session.user}
      showFiscalPeriodSetupNav={showFiscalPeriodSetupNav}
      showFiscalPeriodClosingNav={showFiscalPeriodClosingNav}
    >
      {needsFiscalPeriodSetup ? <FiscalPeriodSetupBanner roleName={session.user.roleName} /> : null}
      {showClosingBanner ? (
        <FiscalPeriodClosingBanner period={closingPeriod} showClosingLink={showClosingBannerLink} />
      ) : null}
      {children}
    </AppShell>
  );
}
