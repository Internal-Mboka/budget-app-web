export default function HomePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_48%,#ffffff_100%)] px-4 py-10 text-[#10579F] dark:bg-[linear-gradient(180deg,#0a1628_0%,#0f1d32_48%,#0a1628_100%)] dark:text-sky-100">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg items-center justify-center">
        <section className="w-full rounded-4xl border border-sky-100 bg-white/90 p-8 text-center shadow-[0_20px_60px_rgba(16,87,159,0.10)] backdrop-blur dark:border-sky-900 dark:bg-slate-900/90">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-400">Mboka Budget</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Version 2.0</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Restructuration en cours. L&apos;authentification et les modules financiers seront disponibles
            prochainement.
          </p>
        </section>
      </main>
    </div>
  );
}
