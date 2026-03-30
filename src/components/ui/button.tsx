import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border border-transparent",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(255,255,255,0.12)] text-foreground border-input hover:bg-[rgba(255,255,255,0.16)]",
        cta:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-110 focus-visible:ring-ring",
        destructive:
          "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 focus-visible:ring-red-500/40",
        outline:
          "border border-input bg-background/40 text-foreground hover:bg-accent hover:border-border-strong",
        secondary:
          "bg-[rgba(255,255,255,0.1)] text-foreground border-input hover:bg-[rgba(255,255,255,0.14)]",
        ghost:
          "text-muted-foreground hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline hover:text-white",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
