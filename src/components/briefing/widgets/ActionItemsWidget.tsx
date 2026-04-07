"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CheckSquare, Circle, Check } from "lucide-react";
import AppleWidgetCard, { type WidgetCardDensity } from "../AppleWidgetCard";
import BriefingEmptyState from "../BriefingEmptyState";
import { mergeWidgetHeaderRight } from "../mergeWidgetHeaderRight";
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
  cardDensity?: WidgetCardDensity;
  layoutMenu?: ReactNode;
};

export default function ActionItemsWidget({
  content,
  staggerIndex = 0,
  isAdmin = false,
  cardDensity,
  layoutMenu,
}: Props) {
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
        density={cardDensity ?? "default"}
        rightElement={mergeWidgetHeaderRight(undefined, layoutMenu)}
      >
        <BriefingEmptyState
          icon={<CheckSquare />}
          title="All caught up"
          description="Nothing due right now. Add a task below when you’re ready."
        />
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="blue"
      icon={<CheckSquare size={20} />}
      title="Action Items"
      staggerIndex={staggerIndex}
      density={cardDensity ?? "default"}
      rightElement={mergeWidgetHeaderRight(undefined, layoutMenu)}
    >
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold tabular-nums text-foreground/90">{urgent.length}</span> urgent
        </span>
        <span>
          <span className="font-semibold tabular-nums text-muted-foreground">{open.length}</span> open
        </span>
        <span>
          <span className="font-semibold tabular-nums text-foreground">{total}</span> total
        </span>
      </div>
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/20 transition-all"
          style={{ width: `${completionPct}%` }}
        />
      </div>
      <ul className="space-y-0.5">
        {top4.map((item) => (
          <li key={item.id}>
            <div
              className={cn(
                "flex items-start gap-2 rounded-md border border-transparent px-1 py-1.5 transition-colors hover:bg-muted/50",
                item.status === "done" && "opacity-60",
                item.priority === "high" && isOverdue(item.due_date) && "bg-muted/50"
              )}
            >
              <button
                type="button"
                onClick={() => toggleDone(item.id)}
                className="mt-0.5 shrink-0 rounded-full border border-border p-0.5 text-muted-foreground transition-colors hover:border-input hover:text-foreground"
              >
                {item.status === "done" ? (
                  <Check size={14} className="text-[var(--color-info)]" />
                ) : (
                  <Circle size={14} />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium text-foreground", item.status === "done" && "line-through")}>
                  <span className="truncate inline align-middle max-w-full">{item.title}</span>
                  {item.related_entity_type === "itinerary" && item.pipeline_stage && (
                    <span className="text-2xs ml-1 inline-block whitespace-nowrap rounded bg-[var(--color-info-muted)] px-1.5 py-0.5 align-middle text-[var(--color-info)]">
                      {PIPELINE_STAGE_LABEL_MAP[item.pipeline_stage as PipelineStage]}
                    </span>
                  )}
                  {isAdmin && item.advisor_name && (
                    <span className="text-2xs text-muted-foreground ml-1">— {item.advisor_name}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.due_date ? (
                    <span
                      className={cn(
                        isOverdue(item.due_date) && "font-medium text-foreground/90",
                        isDueToday(item.due_date) && !isOverdue(item.due_date) && "text-muted-foreground",
                      )}
                    >
                      {isOverdue(item.due_date) ? `Due ${formatDue(item.due_date)}` : isDueToday(item.due_date) ? "Due today" : `Due ${formatDue(item.due_date)}`}
                    </span>
                  ) : null}
                  {item.related_entity_name && <span> · {item.related_entity_name}</span>}
                </p>
              </div>
              {item.status !== "done" && item.priority === "high" && (
                <span
                  className={cn(
                    "text-2xs shrink-0 text-muted-foreground",
                    isOverdue(item.due_date) && "font-semibold text-foreground/80",
                  )}
                >
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
      <div className="mt-4 flex gap-2 rounded-lg border border-border bg-muted/25 p-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add item…"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <button
          type="button"
          onClick={addItem}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Add
        </button>
      </div>
    </AppleWidgetCard>
  );
}
