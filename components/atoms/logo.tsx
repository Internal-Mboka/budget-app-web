import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "auth" | "badge";
  size?: "sm" | "md" | "lg";
};

const badgeSizeMap = {
  sm: { box: "h-11 w-11", image: 44 },
  md: { box: "h-16 w-16", image: 64 },
  lg: { box: "h-20 w-20", image: 80 },
} as const;

export function Logo({ className, variant = "auth", size = "md" }: LogoProps) {
  if (variant === "auth") {
    return (
      <div className={cn("flex w-full justify-center", className)}>
        <Image
          src="/photos/mboka.png"
          alt="Mboka Budget"
          width={170}
          height={170}
          priority
          className="h-auto w-28 object-contain sm:w-36 [filter:var(--mboka-logo-filter)]"
        />
      </div>
    );
  }

  const dimensions = badgeSizeMap[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-3xl bg-[#10579F] ring-1 ring-[#10579F]/20",
        dimensions.box,
        className
      )}
    >
      <Image
        src="/photos/mboka.png"
        alt="Mboka Budget"
        width={dimensions.image}
        height={dimensions.image}
        className="h-[88%] w-[88%] object-contain brightness-0 invert"
        priority
      />
    </div>
  );
}
