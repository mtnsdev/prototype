"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import {
  buildBriefingSummaryLine,
  countNewKnowledgeDocs,
  useActionItems,
  useAdvisories,
  useKnowledgeHighlights,
} from "@/hooks/useBriefingRoom";
import { RecentActivityWidget } from "./widgets/RecentActivityWidget";
import { ActionItemsWidget } from "./widgets/ActionItemsWidget";
import { AdvisoriesWidget } from "./widgets/AdvisoriesWidget";
import { UpcomingTripsWidget } from "./widgets/UpcomingTripsWidget";
import { PreDepartureWidget } from "./widgets/PreDepartureWidget";
import { KnowledgeHighlightsWidget } from "./widgets/KnowledgeHighlightsWidget";
import { PublicationFeedWidget } from "./widgets/PublicationFeedWidget";
import { ProductIntelWidget } from "./widgets/ProductIntelWidget";

function getTimeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

function formatHeaderDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function BriefingRoomContent() {
  const { getFirstName } = useUser();
  const advisoryQ = useAdvisories();
  const knowledgeQ = useKnowledgeHighlights();
  const actionQ = useActionItems();

  const firstName = getFirstName();
  const displayName = firstName === "there" ? "Kristin" : firstName;

  const summaryLine = useMemo(() => {
    if (!advisoryQ.isSuccess || !knowledgeQ.isSuccess || !actionQ.isSuccess) return null;
    return buildBriefingSummaryLine({
      advisoryCount: advisoryQ.data.length,
      newDocCount: countNewKnowledgeDocs(knowledgeQ.data),
      actionCount: actionQ.data.length,
    });
  }, [advisoryQ.isSuccess, advisoryQ.data, knowledgeQ.isSuccess, knowledgeQ.data, actionQ.isSuccess, actionQ.data]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] md:text-2xl">
              {getTimeOfDayGreeting()}, {displayName}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{formatHeaderDate()}</p>
            {summaryLine ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                {summaryLine}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-interactive)]"
            onClick={() => {
              console.log("[BriefingRoom] Customize clicked — TODO: drag-and-drop widget layout");
            }}
            aria-label="Customize briefing layout"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Customize
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <RecentActivityWidget />
          <ActionItemsWidget />
          <AdvisoriesWidget />
          <UpcomingTripsWidget />
          <PreDepartureWidget />
          <KnowledgeHighlightsWidget />
          <PublicationFeedWidget />
          <ProductIntelWidget />
        </div>
      </div>
    </div>
  );
}

export function BriefingRoom() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000 },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <BriefingRoomContent />
    </QueryClientProvider>
  );
}
