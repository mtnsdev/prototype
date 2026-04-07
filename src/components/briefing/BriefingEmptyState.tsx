"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function BriefingEmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-5 py-10 text-center",
        className,
      )}
    >
      <div
        className="mb-3 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted/35 text-muted-foreground ring-1 ring-border/60 [&_svg]:size-6"
        aria-hidden
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
