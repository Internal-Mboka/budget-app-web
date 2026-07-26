"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { mbokaFieldClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type MbokaSelectOption = {
  value: string;
  label: string;
};

type MbokaSelectProps = {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: MbokaSelectOption[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function MbokaSelect({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  required,
  disabled,
  placeholder = "Sélectionner…",
}: MbokaSelectProps) {
  const items = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <Select.Root
      id={id}
      name={name}
      items={items}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onValueChange?.(String(nextValue))}
      required={required}
      disabled={disabled}
    >
      <Select.Trigger
        className={cn(
          mbokaFieldClassName,
          "flex h-auto min-h-12 w-full items-center justify-between gap-2 text-left data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
        )}
      >
        <Select.Value placeholder={placeholder} className="truncate" />
        <Select.Icon className="shrink-0 text-slate-400">
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-50">
          <Select.Popup
            className={cn(
              "max-h-64 min-w-[var(--anchor-width)] overflow-hidden rounded-2xl border border-sky-100 bg-white p-1.5 shadow-xl shadow-sky-100/60",
              "dark:border-sky-900 dark:bg-slate-900 dark:shadow-sky-950/40"
            )}
          >
            <Select.List className="outline-none">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "flex cursor-default items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none",
                    "data-[highlighted]:bg-sky-50 data-[highlighted]:text-[#10579F]",
                    "dark:text-slate-200 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-sky-50"
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="text-[#10579F] dark:text-sky-400">
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
