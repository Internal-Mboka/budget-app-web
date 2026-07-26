"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { mbokaFieldClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(mbokaFieldClassName, "h-auto min-h-12 pr-12", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-[#10579F] dark:hover:text-sky-400"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  }
);
