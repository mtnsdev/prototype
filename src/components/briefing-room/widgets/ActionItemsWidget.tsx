"use client";

import { useMemo, useState } from "react";
import { ListTodo } from "lucide-react";
import type { ActionItem, ActionItemPriority } from "@/types/briefing-room";
import { useActionItems } from "@/hooks/useBriefingRoom";
import { WidgetShell } from "../WidgetShell";
import { cn } from "@/lib/utils";

const PRIORITY_ORDER: ActionItemPriority[] = ["urgent", "normal", "low"];

function priorityDotClass(p: ActionItemPriority): string {
  switch (p) {
    case "urgent":
      return "bg-[var(--color-error)]";
    case "normal":
      return "bg-[var(--color-warning)]";
    case "low":
      return "bg-[var(--color-info)]";
    default:
      return "bg-[var(--text-quaternary)]";
  }
}

export function ActionItemsWidget() {
  const { data, isPending, isError, error } = useActionItems();
  const [done, setDone] = useState<Set<string>>(() => new Set());

  const items = data ?? [];
  const sorted = useMemo(() => {
    return [...items].sort(
      (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    );
  }, [items]);

  const visible = sorted.filter((i) => !done.has(i.id));

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <WidgetShell
      title="Action items"
      icon={ListTodo}
      loading={isPending}
      error={isError ? (error?.message ?? "Could not load tasks") : undefined}
      skeletonRows={4}
    >
      {visible.length === 0 && items.length > 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">You&apos;re caught up for now.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No action items.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item.id}>
              <ActionRow item={item} onToggle={() => toggle(item.id)} />
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

function ActionRow({ item, onToggle }: { item: ActionItem; onToggle: () => void }) {
  return (
    <div className="flex gap-3 rounded-lg border border-transparent px-1 py-1.5 hover:border-[var(--border-subtle)] hover:bg-[var(--surface-base)]/30">
      <input
        type="checkbox"
        checked={false}
        onChange={onToggle}
        className={cn(
          "mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[var(--border-default)] bg-[var(--surface-base)]",
          "text-[var(--brand-chat-user)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-chat-user)]/40"
        )}
        aria-label={`Mark complete: ${item.description}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn("inline-block h-2 w-2 shrink-0 rounded-full", priorityDotClass(item.priority))}
            title={item.priority}
            aria-hidden
          />
          <span className="text-sm text-[var(--text-primary)]">{item.description}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--surface-interactive)] px-2 py-0.5 text-2xs text-[var(--text-secondary)]">
            {item.source}
          </span>
        </div>
      </div>
    </div>
  );
}
