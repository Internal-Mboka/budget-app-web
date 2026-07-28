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
  descriptionAside?: React.ReactNode;
  className?: string;
};

export function MbokaPageHeader({
  eyebrow,
  title,
  description,
  descriptionAside,
  className,
}: MbokaPageHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      {eyebrow ? <p className={mbokaEyebrowClassName}>{eyebrow}</p> : null}
      <h1 className={mbokaTitleClassName}>{title}</h1>
      {description || descriptionAside ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          {description ? <p className={mbokaSubtitleClassName}>{description}</p> : <span />}
          {descriptionAside ? <div className="shrink-0">{descriptionAside}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
