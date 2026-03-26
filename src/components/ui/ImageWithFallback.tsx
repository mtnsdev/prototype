"use client";

import { useState } from "react";
import {
  Bed,
  MapPin,
  Ship,
  Briefcase,
  Compass,
  UtensilsCrossed,
  Car,
  Plane,
  Clock,
  StickyNote,
  Star,
  Globe,
  User,
} from "lucide-react";
import type { ProductCategory } from "@/types/product";
import type { EventType } from "@/types/itinerary";
import { CATEGORY_ICONS } from "@/config/productCategoryConfig";
import { cn } from "@/lib/utils";

const PRODUCT_GRADIENT: Record<ProductCategory, string> = {
  accommodation: "from-blue-900 to-blue-700",
  dmc: "from-emerald-900 to-emerald-700",
  cruise: "from-cyan-900 to-cyan-700",
  service_provider: "from-amber-900 to-amber-700",
  activity: "from-orange-900 to-orange-700",
  restaurant: "from-rose-900 to-rose-700",
  transportation: "from-purple-900 to-purple-700",
};

const EVENT_ICONS: Record<EventType, React.ComponentType<{ size?: number; className?: string }>> = {
  stay: Bed,
  meal: UtensilsCrossed,
  transfer: Car,
  activity: Star,
  experience: Compass,
  flight: Plane,
  free_time: Clock,
  note: StickyNote,
};

const EVENT_GRADIENT: Record<EventType, string> = {
  stay: "from-blue-900 to-blue-700",
  meal: "from-rose-900 to-rose-700",
  transfer: "from-purple-900 to-purple-700",
  activity: "from-orange-900 to-orange-700",
  experience: "from-cyan-900 to-cyan-700",
  flight: "from-zinc-800 to-zinc-700",
  free_time: "from-zinc-800 to-zinc-700",
  note: "from-zinc-800 to-zinc-700",
};

const AVATAR_COLORS = [
  "bg-slate-700",
  "bg-zinc-700",
  "bg-stone-700",
  "bg-neutral-700",
  "bg-blue-800",
  "bg-violet-800",
  "bg-emerald-800",
  "bg-amber-800",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getInitials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name || "?")[0].toUpperCase();
}

export type FallbackType = "product" | "event" | "trip" | "avatar";

type BaseProps = {
  alt: string;
  className?: string;
  /** When true, image uses object-cover and fills container */
  fill?: boolean;
};

type ProductFallbackProps = BaseProps & {
  fallbackType: "product";
  src: string | undefined;
  productCategory: ProductCategory;
};

type EventFallbackProps = BaseProps & {
  fallbackType: "event";
  src: string | undefined;
  eventType: EventType;
};

type TripFallbackProps = BaseProps & {
  fallbackType: "trip";
  src: string | undefined;
};

type AvatarFallbackProps = BaseProps & {
  fallbackType: "avatar";
  src?: string | undefined;
  name: string;
};

export type ImageWithFallbackProps =
  | ProductFallbackProps
  | EventFallbackProps
  | TripFallbackProps
  | AvatarFallbackProps;

export default function ImageWithFallback(props: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const { alt, className, fill = true } = props;
  const src = "src" in props ? props.src : undefined;
  const showFallback = !src || error;

  if (props.fallbackType === "avatar") {
    const { name } = props;
    const initials = getInitials(name);
    const colorIndex = hashName(name) % AVATAR_COLORS.length;
    const bgClass = AVATAR_COLORS[colorIndex];
    if (src && !error) {
      return (
        <img
          src={src}
          alt={alt}
          className={cn(fill && "object-cover w-full h-full", className)}
          onError={() => setError(true)}
        />
      );
    }
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full text-white font-semibold shrink-0",
          bgClass,
          className
        )}
        title={name}
      >
        {initials}
      </div>
    );
  }

  if (showFallback) {
    if (props.fallbackType === "product") {
      const Icon = CATEGORY_ICONS[props.productCategory] ?? Bed;
      const gradient = PRODUCT_GRADIENT[props.productCategory] ?? "from-zinc-800 to-zinc-700";
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-gradient-to-br opacity-90",
            gradient,
            className
          )}
        >
          <Icon size={typeof className === "string" && className.includes("w-10") ? 20 : 24} className="text-white opacity-40" />
        </div>
      );
    }
    if (props.fallbackType === "event") {
      const Icon = EVENT_ICONS[props.eventType] ?? Star;
      const gradient = EVENT_GRADIENT[props.eventType] ?? "from-zinc-800 to-zinc-700";
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-gradient-to-br rounded-lg opacity-90",
            gradient,
            className
          )}
        >
          <Icon size={20} className="text-white opacity-40" />
        </div>
      );
    }
    if (props.fallbackType === "trip") {
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800",
            className
          )}
        >
          <Globe size={28} className="text-white opacity-40" />
        </div>
      );
    }
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(fill && "object-cover w-full h-full", className)}
      onError={() => setError(true)}
    />
  );
}
