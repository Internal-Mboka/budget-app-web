"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonClassName = cn(
    "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-white/90 text-[#10579F] transition",
    "hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2",
    "dark:border-sky-900 dark:bg-slate-900/90 dark:text-sky-100 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-900"
  );

  if (!mounted) {
    return (
      <button type="button" aria-label="Changer de thème" disabled className={buttonClassName}>
        <Sun className="size-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      data-testid="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={buttonClassName}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
