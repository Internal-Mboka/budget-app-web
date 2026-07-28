"use client";

import { Toaster } from "sonner";

import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="mboka-theme"
      disableTransitionOnChange
    >
      {children}
      <Toaster
        richColors
        closeButton
        position="top-right"
        offset={{ top: "3.75rem" }}
        toastOptions={{
          classNames: {
            toast:
              "rounded-2xl border border-sky-100 bg-white/95 text-slate-700 shadow-[var(--mboka-card-shadow)] backdrop-blur dark:border-sky-900 dark:bg-slate-900/95 dark:text-slate-100",
            title: "font-semibold text-[#10579F] dark:text-sky-50",
            description: "text-slate-500 dark:text-slate-400",
            actionButton:
              "rounded-xl bg-[#10579F] text-white dark:bg-sky-400 dark:text-slate-950",
            cancelButton:
              "rounded-xl border border-sky-100 bg-white dark:border-sky-900 dark:bg-slate-900",
          },
        }}
      />
    </ThemeProvider>
  );
}
