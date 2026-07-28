"use client";

import type { ReactNode } from "react";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";

import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaInfoPopoverProps = {
  title: string;
  children: ReactNode;
  testId?: string;
  className?: string;
};

export function MbokaInfoPopover({ title, children, testId, className }: MbokaInfoPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        aria-label={title}
        data-testid={testId}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50/60 text-slate-400 transition-colors",
          "hover:border-sky-200 hover:bg-sky-100/80 hover:text-[#10579F]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2",
          "dark:border-sky-900 dark:bg-slate-800/60 dark:text-slate-500 dark:hover:border-sky-800 dark:hover:text-sky-200 dark:focus-visible:ring-sky-900",
          className
        )}
      >
        <Info className="size-4" aria-hidden="true" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup
            className={cn(
              mbokaPanelClassName,
              "w-[min(100vw-2rem,18rem)] origin-[var(--transform-origin)] p-4 shadow-lg",
              "transition-[transform,scale,opacity] duration-150",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
            )}
          >
            <Popover.Title className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
              {title}
            </Popover.Title>
            <Popover.Description asChild>
              <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {children}
              </div>
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
