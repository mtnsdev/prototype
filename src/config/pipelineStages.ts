import type { PipelineStage } from "@/types/itinerary";

export const PIPELINE_STAGES: { key: PipelineStage; label: string; icon: string }[] = [
  { key: "lead", label: "Lead", icon: "UserPlus" },
  { key: "discovery", label: "Discovery", icon: "Phone" },
  { key: "proposal", label: "Proposal", icon: "FileText" },
  { key: "revision", label: "Revision", icon: "RefreshCw" },
  { key: "committed", label: "Committed", icon: "CheckCircle" },
  { key: "preparing", label: "Preparing", icon: "ClipboardList" },
  { key: "final_review", label: "Final Review", icon: "Eye" },
  { key: "traveling", label: "Traveling", icon: "Plane" },
  { key: "post_travel", label: "Post-Travel", icon: "Heart" },
  { key: "archived", label: "Archived", icon: "Archive" },
];

export const PIPELINE_STAGE_LABEL_MAP: Record<PipelineStage, string> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.key, s.label])
) as Record<PipelineStage, string>;

/** Unified pipeline pills — contrast via typography, not rainbow fills */
export function pipelineStageBadgeClass(_stage: PipelineStage): string {
  return "bg-muted-foreground/8 text-muted-foreground border border-border/60";
}
