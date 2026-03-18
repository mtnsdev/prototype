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

export function pipelineStageBadgeClass(stage: PipelineStage): string {
  const map: Record<PipelineStage, string> = {
    lead: "bg-gray-500/10 text-gray-400",
    discovery: "bg-blue-500/10 text-blue-400",
    proposal: "bg-indigo-500/10 text-indigo-400",
    revision: "bg-amber-500/10 text-amber-400",
    committed: "bg-emerald-500/10 text-emerald-400",
    preparing: "bg-teal-500/10 text-teal-400",
    final_review: "bg-cyan-500/10 text-cyan-400",
    traveling: "bg-violet-500/10 text-violet-400",
    post_travel: "bg-pink-500/10 text-pink-400",
    archived: "bg-gray-500/10 text-gray-500",
  };
  return map[stage] ?? map.lead;
}
