"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

const DEFAULT_SELECTOR =
  "[data-form-autofocus], input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled])";

export function useFormAutofocus(
  containerRef: RefObject<HTMLElement | null>,
  selector: string = DEFAULT_SELECTOR
): void {
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const timer = window.setTimeout(() => {
      const target = container.querySelector<HTMLElement>(selector);

      if (target && document.activeElement !== target) {
        target.focus();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [containerRef, selector]);
}

export function useTransactionFormShortcuts(formRef: RefObject<HTMLFormElement | null>): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const form = formRef.current;

      if (!form || !form.contains(document.activeElement)) {
        return;
      }

      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey || event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      form.requestSubmit();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formRef]);
}
