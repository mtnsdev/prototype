"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type buttonVariants } from "./button";
import { Spinner } from "./skeletons";
import type { VariantProps } from "class-variance-authority";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
  spinnerSize?: "xs" | "sm" | "md" | "lg";
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      disabled,
      children,
      spinnerSize = "sm",
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        className={className}
        variant={variant}
        size={size}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size={spinnerSize} className="mr-1" />}
        {children}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
