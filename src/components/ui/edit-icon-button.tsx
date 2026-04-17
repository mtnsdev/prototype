import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;

export type EditIconButtonProps = Omit<ButtonProps, "children" | "aria-label"> & {
  /** Accessible name (sets `aria-label`). */
  label: string;
  /** Override pencil size in dense layouts. */
  iconClassName?: string;
};

/**
 * Icon-only edit affordance (ghost + pencil). Use wherever a compact edit control is needed
 * so hover, focus, and hit target stay consistent.
 */
export function EditIconButton({
  label,
  className,
  iconClassName,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: EditIconButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      aria-label={label}
      {...props}
    >
      <Pencil className={cn("size-3.5 shrink-0", iconClassName)} aria-hidden />
    </Button>
  );
}
