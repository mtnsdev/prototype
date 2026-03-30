import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-inset px-3 py-1 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[rgba(255,255,255,0.25)] focus-visible:ring-[3px] focus-visible:ring-[rgba(255,255,255,0.1)]",
        "aria-invalid:border-red-500/50 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
