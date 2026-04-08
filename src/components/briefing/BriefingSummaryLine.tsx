"use client";

import { useMemo } from "react";
import type { BriefingWidget } from "@/types/briefing";
import {
  buildBriefingSummaryLine,
  buildSubtitleFromWidgets,
  countNewKnowledgeDocs,
  pickRotatingBriefingSubtitle,
  useActionItems,
  useAdvisories,
  useKnowledgeHighlights,
} from "@/hooks/useBriefingRoom";

const subtitleClass =
  "mt-2 max-w-2xl text-sm leading-relaxed text-[rgba(245,245,245,0.64)]";

type Props = {
  widgets?: BriefingWidget[];
  loading?: boolean;
};

/**
 * Greeting subtitle: widget payloads first, then intelligence queries, then rotating demo copy.
 */
export function BriefingSummaryLine({ widgets, loading = false }: Props) {
  const advisoryQ = useAdvisories();
  const knowledgeQ = useKnowledgeHighlights();
  const actionQ = useActionItems();

  const text = useMemo(() => {
    if (loading) return null;
    const fromWidgets = buildSubtitleFromWidgets(widgets);
    if (fromWidgets) return fromWidgets;
    if (advisoryQ.isSuccess && knowledgeQ.isSuccess && actionQ.isSuccess) {
      const fromQueries = buildBriefingSummaryLine({
        advisoryCount: advisoryQ.data.length,
        newDocCount: countNewKnowledgeDocs(knowledgeQ.data),
        actionCount: actionQ.data.length,
      });
      if (fromQueries) return fromQueries;
    }
    return pickRotatingBriefingSubtitle(widgets);
  }, [
    loading,
    widgets,
    advisoryQ.isSuccess,
    advisoryQ.data,
    knowledgeQ.isSuccess,
    knowledgeQ.data,
    actionQ.isSuccess,
    actionQ.data,
  ]);

  if (loading) {
    return <p className={subtitleClass}>Syncing your briefing…</p>;
  }

  if (!text) return null;

  return <p className={subtitleClass}>{text}</p>;
}
