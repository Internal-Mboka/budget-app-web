import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type MbokaBackLinkProps = {
  href: string;
  label?: string;
  className?: string;
  testId?: string;
};

export function MbokaBackLink({
  href,
  label = "Retour",
  className,
  testId = "mboka-back-link",
}: MbokaBackLinkProps) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-[#10579F] dark:text-sky-400 dark:hover:text-sky-300",
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" />
      {label}
    </Link>
  );
}
