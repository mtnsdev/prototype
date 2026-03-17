"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { ActionItemsContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

function priorityColor(p: string): string {
  if (p === "high") return "text-[var(--muted-error-text)]";
  if (p === "medium") return "text-[var(--muted-amber-text)]";
  return "text-[var(--muted-success-text)]";
}

function isOverdue(due?: string): boolean {
  if (!due) return false;
  return new Date(due) < new Date() && due < new Date().toISOString().slice(0, 10);
}

type Props = { content: ActionItemsContent };

export default function ActionItemsWidget({ content }: Props) {
  const [items, setItems] = useState(content.items ?? []);
  const [newTitle, setNewTitle] = useState("");

  const sorted = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  const toggleDone = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: i.status === "done" ? "pending" : "done" as const }
          : i
      )
    );
  };

  const addItem = () => {
    if (!newTitle.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        title: newTitle.trim(),
        priority: "medium" as const,
        status: "pending" as const,
      },
    ]);
    setNewTitle("");
  };

  if (items.length === 0 && !newTitle) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[rgba(245,245,245,0.5)]">No action items.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add item..."
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)]"
          />
          <button
            type="button"
            onClick={addItem}
            className="rounded-md bg-white/10 px-3 py-2 text-sm text-[#F5F5F5] hover:bg-white/15"
          >
            Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {sorted.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-white/[0.03] p-2 transition-opacity",
              item.status === "done" && "opacity-60"
            )}
          >
            <button
              type="button"
              onClick={() => toggleDone(item.id)}
              className="shrink-0 mt-0.5 text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5]"
            >
              {item.status === "done" ? <Check size={16} /> : <Circle size={16} className={priorityColor(item.priority)} />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm text-[#F5F5F5]", item.status === "done" && "line-through")}>
                {item.title}
              </p>
              {item.due_date && (
                <p className={cn("text-xs mt-0.5", isOverdue(item.due_date) ? "text-[var(--muted-error-text)]" : "text-[rgba(245,245,245,0.5)]")}>
                  Due {new Date(item.due_date).toLocaleDateString()}
                </p>
              )}
              {item.related_entity_name && item.related_entity_id && (
                <Link
                  href={
                    item.related_entity_type === "itinerary"
                      ? `/dashboard/itineraries/${item.related_entity_id}`
                      : item.related_entity_type === "vic"
                        ? `/dashboard/vics/${item.related_entity_id}`
                        : "#"
                  }
                  className="text-xs text-[rgba(245,245,245,0.7)] hover:underline mt-0.5 inline-block"
                >
                  {item.related_entity_name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add item..."
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)]"
        />
        <button
          type="button"
          onClick={addItem}
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-[#F5F5F5] hover:bg-white/15"
        >
          Add
        </button>
      </div>
    </div>
  );
}
