"use client";

import type { ElementType } from "react";

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
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-xs text-gray-600 max-w-[280px]">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
