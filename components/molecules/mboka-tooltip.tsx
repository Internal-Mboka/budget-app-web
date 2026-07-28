"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

type MbokaTooltipProps = {
  label: string;
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
};

export function MbokaTooltip({
  label,
  children,
  side = "right",
  align = "center",
  className,
}: MbokaTooltipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} aria-label={label} />
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} align={align} sideOffset={8} className="z-50">
          <Tooltip.Popup
            className={cn(
              "max-w-[15rem] rounded-xl border border-sky-100 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600 shadow-[0_12px_32px_rgba(16,87,159,0.12)]",
              "origin-[var(--transform-origin)] transition-[transform,scale,opacity] duration-150",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              "dark:border-sky-900 dark:bg-slate-900 dark:text-slate-300 dark:shadow-slate-950/40",
              className
            )}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

type MbokaTooltipProviderProps = {
  children: React.ReactNode;
  delay?: number;
};

export function MbokaTooltipProvider({ children, delay = 400 }: MbokaTooltipProviderProps) {
  return <Tooltip.Provider delay={delay}>{children}</Tooltip.Provider>;
}
