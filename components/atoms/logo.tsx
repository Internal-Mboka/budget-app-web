import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { box: "h-10 w-10", image: 40 },
  md: { box: "h-16 w-16", image: 64 },
  lg: { box: "h-24 w-24", image: 96 },
} as const;

export function Logo({ className, size = "md" }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-3xl bg-primary/10 ring-1 ring-primary/15",
        dimensions.box,
        className
      )}
    >
      <Image
        src="/photos/mboka.png"
        alt="Mboka Budget"
        width={dimensions.image}
        height={dimensions.image}
        className="h-[70%] w-[70%] object-contain dark:brightness-0 dark:invert"
        priority
      />
    </div>
  );
}
