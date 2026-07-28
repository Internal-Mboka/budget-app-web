export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncExpiredFiscalPeriodsOnStartup } = await import(
      "@/lib/fiscal-period/sync-expired-periods"
    );
    const { syncApprovedFiscalPeriodClosingsOnStartup } = await import(
      "@/lib/fiscal-period/finalize-closing"
    );

    await syncExpiredFiscalPeriodsOnStartup();
    await syncApprovedFiscalPeriodClosingsOnStartup();
  }
}
