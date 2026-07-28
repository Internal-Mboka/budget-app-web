export type AppKeyboardShortcutConfig = {
  canCreateRevenue: boolean;
  canCreateExpense: boolean;
};

function isShortcutEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function isPrimaryModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

export function getNewTransactionShortcutPath(config: AppKeyboardShortcutConfig): string | null {
  if (config.canCreateRevenue) {
    return "/revenues/new";
  }

  if (config.canCreateExpense) {
    return "/expenses/new";
  }

  return null;
}

export function shouldTriggerNewTransactionShortcut(event: KeyboardEvent): boolean {
  if (!isPrimaryModifier(event) || event.altKey) {
    return false;
  }

  return event.shiftKey && event.key.toLowerCase() === "n";
}

export function shouldTriggerFormSubmitShortcut(event: KeyboardEvent): boolean {
  if (!isPrimaryModifier(event) || event.shiftKey || event.altKey) {
    return false;
  }

  return event.key === "Enter";
}

export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  if (isShortcutEditableTarget(event.target) && !isPrimaryModifier(event)) {
    return true;
  }

  return false;
}

export const KEYBOARD_SHORTCUTS_HELP = [
  "Ctrl+Shift+N — nouvelle transaction",
  "Ctrl+Entrée — valider le formulaire en cours",
] as const;
