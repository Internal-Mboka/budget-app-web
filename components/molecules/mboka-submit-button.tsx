"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { mbokaButtonPrimaryClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaSubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  testId?: string;
};

export function MbokaSubmitButton({
  children,
  pendingLabel = "Enregistrement...",
  className,
  testId,
}: MbokaSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={cn(mbokaButtonPrimaryClassName, className)}
      disabled={pending}
      aria-busy={pending}
      data-testid={testId}
      data-pending={pending ? "true" : "false"}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

type MbokaPendingFieldsetProps = {
  children: React.ReactNode;
  className?: string;
};

export function MbokaPendingFieldset({ children, className }: MbokaPendingFieldsetProps) {
  const { pending } = useFormStatus();

  return (
    <fieldset disabled={pending} className={cn("min-w-0 space-y-6 border-0 p-0", className)}>
      {children}
    </fieldset>
  );
}
