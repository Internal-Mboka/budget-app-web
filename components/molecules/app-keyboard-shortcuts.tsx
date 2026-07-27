"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import {
  getNewTransactionShortcutPath,
  KEYBOARD_SHORTCUTS_HELP,
  shouldIgnoreShortcut,
  shouldTriggerFormSubmitShortcut,
  shouldTriggerNewTransactionShortcut,
  type AppKeyboardShortcutConfig,
} from "@/lib/ux/keyboard-shortcuts";

type AppKeyboardShortcutsProps = AppKeyboardShortcutConfig;

export function AppKeyboardShortcuts({ canCreateRevenue, canCreateExpense }: AppKeyboardShortcutsProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (shouldTriggerNewTransactionShortcut(event)) {
        event.preventDefault();

        const path = getNewTransactionShortcutPath({ canCreateRevenue, canCreateExpense });

        if (path) {
          router.push(path);
        }

        return;
      }

      if (event.key === "?" && isPrimaryHelpShortcut(event)) {
        event.preventDefault();
        toast.message("Raccourcis clavier", {
          description: KEYBOARD_SHORTCUTS_HELP.join(" · "),
          duration: 6000,
        });
        return;
      }

      if (shouldIgnoreShortcut(event)) {
        return;
      }

      if (shouldTriggerFormSubmitShortcut(event)) {
        const activeForm = (event.target as HTMLElement | null)?.closest("form");

        if (activeForm instanceof HTMLFormElement) {
          event.preventDefault();
          activeForm.requestSubmit();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canCreateExpense, canCreateRevenue, router]);

  return null;
}

function isPrimaryHelpShortcut(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && event.shiftKey;
}
