"use client";

import { useState } from "react";
import { CheckSquare, Circle, Check } from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import type { ActionItemsContent, ActionItemEntry } from "@/types/briefing";
import { PIPELINE_STAGE_LABEL_MAP } from "@/config/pipelineStages";
import type { PipelineStage } from "@/types/itinerary";
import { cn } from "@/lib/utils";

function isOverdue(due?: string): boolean {
  if (!due) return false;
  const today = new Date().toISOString().slice(0, 10);
  return due < today;
}

function isDueToday(due?: string): boolean {
  if (!due) return false;
  const today = new Date().toISOString().slice(0, 10);
  return due === today;
}

function formatDue(due: string): string {
  const d = new Date(due);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}

type Props = {
  content: ActionItemsContent;
  staggerIndex?: number;
  isAdmin?: boolean;
};

export default function ActionItemsWidget({ content, staggerIndex = 0, isAdmin = false }: Props) {
  const [items, setItems] = useState(content.items ?? []);
  const [newTitle, setNewTitle] = useState("");

  const open = items.filter((i) => i.status !== "done");
  const done = items.filter((i) => i.status === "done");
  const urgent = items.filter((i) => i.priority === "high" && i.status !== "done");
  const total = items.length;
  const completionPct = total ? Math.round((done.length / total) * 100) : 0;

  const sorted: ActionItemEntry[] = [...open].sort((a, b) => {
    const aOver = isOverdue(a.due_date) ? 1 : 0;
    const bOver = isOverdue(b.due_date) ? 1 : 0;
    if (aOver !== bOver) return bOver - aOver;
    const aToday = isDueToday(a.due_date) ? 1 : 0;
    const bToday = isDueToday(b.due_date) ? 1 : 0;
    if (aToday !== bToday) return bToday - aToday;
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });
  const top4 = sorted.slice(0, 4);
  const moreCount = open.length - 4;

  const toggleDone = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: i.status === "done" ? "pending" : "done" }
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
      <AppleWidgetCard
        accent="blue"
        icon={<CheckSquare size={20} />}
        title="Action Items"
        staggerIndex={staggerIndex}
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckSquare size={28} className="text-muted-foreground/70 mb-2" />
          <p className="text-sm text-muted-foreground">All caught up — nothing due</p>
        </div>
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="blue"
      icon={<CheckSquare size={20} />}
      title="Action Items"
      staggerIndex={staggerIndex}
    >
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-red-400">{urgent.length}</p>
          <p className="text-xs text-muted-foreground">urgent</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-400">{open.length}</p>
          <p className="text-xs text-muted-foreground">open</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-muted-foreground">total</p>
        </div>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${completionPct}%` }}
        />
      </div>
      <ul className="space-y-1">
        {top4.map((item) => (
          <li key={item.id}>
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg p-2 hover:bg-white/[0.04] transition-colors",
                item.status === "done" && "opacity-60",
                item.priority === "high" && isOverdue(item.due_date) && "bg-red-500/5"
              )}
            >
              <button
                type="button"
                onClick={() => toggleDone(item.id)}
                className="shrink-0 mt-0.5 text-muted-foreground hover:text-white border border-border hover:border-white/20 rounded-full p-0.5 transition-colors"
              >
                {item.status === "done" ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Circle size={14} />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium text-white", item.status === "done" && "line-through")}>
                  <span className="truncate inline align-middle max-w-full">{item.title}</span>
                  {item.related_entity_type === "itinerary" && item.pipeline_stage && (
                    <span className="text-2xs text-emerald-400/50 bg-emerald-500/5 px-1.5 py-0.5 rounded ml-1 align-middle whitespace-nowrap">
                      {PIPELINE_STAGE_LABEL_MAP[item.pipeline_stage as PipelineStage]}
                    </span>
                  )}
                  {isAdmin && item.advisor_name && (
                    <span className="text-2xs text-muted-foreground ml-1">— {item.advisor_name}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.due_date ? (
                    <span className={cn(isOverdue(item.due_date) && "text-red-400", isDueToday(item.due_date) && !isOverdue(item.due_date) && "text-[var(--color-warning)]")}>
                      {isOverdue(item.due_date) ? `Due ${formatDue(item.due_date)}` : isDueToday(item.due_date) ? "Due today" : `Due ${formatDue(item.due_date)}`}
                    </span>
                  ) : null}
                  {item.related_entity_name && <span> · {item.related_entity_name}</span>}
                </p>
              </div>
              {item.status !== "done" && item.priority === "high" && (
                <span className={cn("text-2xs shrink-0", isOverdue(item.due_date) ? "text-red-400" : "text-[var(--color-warning)]")}>
                  {isOverdue(item.due_date) ? "!!" : "!"}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {moreCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2">+{moreCount} more items</p>
      )}
      <div className="flex gap-2 mt-4 p-2 rounded-lg bg-white/[0.03]">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add item…"
          className="flex-1 min-w-0 rounded-md border border-border bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-input focus:outline-none"
        />
        <button
          type="button"
          onClick={addItem}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground/90 hover:border-white/20 hover:text-white transition-colors"
        >
          Add
        </button>
      </div>
    </AppleWidgetCard>
  );
}
