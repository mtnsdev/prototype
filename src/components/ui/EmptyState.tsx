"use client";

import type { ElementType } from "react";
import { Button } from "@/components/ui/button";

export type EmptyStateAction = { label: string; onClick: () => void };

export type EmptyStateProps = {
  icon: ElementType<{ className?: string }>;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
};

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className ?? ""}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-border flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-muted-foreground/70" />
      </div>
      <p className="text-sm text-muted-foreground/90 mb-1">{title}</p>
      <p className="text-xs text-muted-foreground/70 max-w-[280px]">{description}</p>
      {action && (
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={action.onClick}
          className="mt-4 h-auto p-0 text-compact text-[var(--brand-cta)] underline-offset-4 hover:text-[var(--brand-cta-hover)]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
