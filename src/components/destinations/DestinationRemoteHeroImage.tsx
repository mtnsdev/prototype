"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  /** Decorative hero band — empty keeps screen-reader clean. */
  alt?: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  onBroken: () => void;
};

/**
 * Optimized remote hero for Unsplash / Picsum — uses `next/image` with app `remotePatterns`.
 */
export function DestinationRemoteHeroImage({
  src,
  alt = "",
  className,
  sizes,
  priority = false,
  onBroken,
}: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes={sizes}
      priority={priority}
      onError={onBroken}
    />
  );
}
