import { cn } from "@/lib/utils";
import {
  mbokaEyebrowClassName,
  mbokaSubtitleClassName,
  mbokaTitleClassName,
} from "@/lib/design-tokens";

type MbokaPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function MbokaPageHeader({ eyebrow, title, description, className }: MbokaPageHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      {eyebrow ? <p className={mbokaEyebrowClassName}>{eyebrow}</p> : null}
      <h1 className={mbokaTitleClassName}>{title}</h1>
      {description ? <p className={mbokaSubtitleClassName}>{description}</p> : null}
    </header>
  );
}
