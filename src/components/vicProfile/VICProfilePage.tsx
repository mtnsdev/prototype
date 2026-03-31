"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVICProfileData } from "./hooks/useVICProfileData";
import { VICProfileHeader } from "./VICProfileHeader";
import { OverviewTab } from "./tabs/OverviewTab";
import { IntelligenceTab } from "./tabs/IntelligenceTab";
import { JourneyHistoryTab } from "./tabs/JourneyHistoryTab";
import { ActiveTravelTab } from "./tabs/ActiveTravelTab";
import { NetworkTab } from "./tabs/NetworkTab";
import { FinancialsTab } from "./tabs/FinancialsTab";
import { CommunicationsTab } from "./tabs/CommunicationsTab";
import { AdvisoriesNotesTab } from "./tabs/AdvisoriesNotesTab";
import { getAllPersonaBundles } from "@/lib/vic-profile-mock";

export type VicProfileTabId =
  | "overview"
  | "intelligence"
  | "journey"
  | "activeTravel"
  | "network"
  | "financials"
  | "communications"
  | "advisories";

const TABS: { id: VicProfileTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "intelligence", label: "Intelligence" },
  { id: "journey", label: "Journey history" },
  { id: "activeTravel", label: "Active travel" },
  { id: "network", label: "Network" },
  { id: "financials", label: "Financials" },
  { id: "communications", label: "Communications" },
  { id: "advisories", label: "Advisories & notes" },
];

const VALID = new Set<VicProfileTabId>(TABS.map((t) => t.id));

type Props = { routeVicId: string };

export function VICProfilePage({ routeVicId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: VicProfileTabId = tabParam && VALID.has(tabParam as VicProfileTabId) ? (tabParam as VicProfileTabId) : "overview";

  const { bundle, loading } = useVICProfileData(routeVicId);

  const setTab = (tab: VicProfileTabId) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", tab);
    router.replace(`/dashboard/vics/${routeVicId}/advisor-profile?${next.toString()}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-inset">
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          <div className="h-4 w-40 animate-pulse rounded bg-muted/50" />
          <div className="flex gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-muted/50" />
            <div className="flex-1 space-y-2">
              <div className="h-7 w-64 animate-pulse rounded bg-muted/50" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted/40" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1 border-b border-border pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-md bg-muted/40" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-xl border border-border bg-card/40" />
            <div className="h-28 animate-pulse rounded-xl border border-border bg-card/40" />
            <div className="h-44 animate-pulse rounded-xl border border-border bg-card/40" />
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    const demos = getAllPersonaBundles();
    return (
      <div className="flex h-full items-center justify-center overflow-y-auto bg-inset p-6">
        <div className="max-w-lg text-center">
          <h2 className="text-lg font-semibold text-foreground">No advisor profile seed for this VIC</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Link a legacy list id (e.g. <code className="rounded bg-muted/50 px-1">vic-001</code>) or open a demo persona
            below.
          </p>
          <ul className="mt-6 space-y-2 text-left text-sm">
            {demos.map((p) => (
              <li key={p.personaKey}>
                <Link
                  href={`/dashboard/vics/${p.profile.id}/advisor-profile`}
                  className="text-[var(--brand-cta)] hover:underline"
                >
                  {p.profile.firstName} {p.profile.lastName}
                </Link>
                <span className="text-muted-foreground"> — {p.personaKey}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/vics"
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to VICs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-inset">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Link
          href={`/dashboard/vics/${routeVicId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to VIC record
        </Link>

        <VICProfileHeader profile={bundle.profile} />

        <div className="flex flex-wrap gap-1 border-b border-border -mx-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap border-b-2 -mb-px px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === t.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-muted-foreground/90"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pb-10">
          {activeTab === "overview" ? <OverviewTab bundle={bundle} vicPageId={routeVicId} /> : null}
          {activeTab === "intelligence" ? <IntelligenceTab domains={bundle.domains} /> : null}
          {activeTab === "journey" ? <JourneyHistoryTab trips={bundle.trips} /> : null}
          {activeTab === "activeTravel" ? (
            <ActiveTravelTab trips={bundle.trips} proposals={bundle.proposals} actionItems={bundle.actionItems} />
          ) : null}
          {activeTab === "network" ? <NetworkTab relationships={bundle.relationships} /> : null}
          {activeTab === "financials" ? <FinancialsTab financials={bundle.financials} trips={bundle.trips} /> : null}
          {activeTab === "communications" ? (
            <CommunicationsTab
              touchPoints={bundle.touchPoints}
              specialRequests={bundle.specialRequests}
              giftLogs={bundle.giftLogs}
            />
          ) : null}
          {activeTab === "advisories" ? (
            <AdvisoriesNotesTab
              advisories={bundle.advisories}
              sourceConflicts={bundle.sourceConflicts}
              advisorNotes={bundle.advisorNotes}
              internalFlags={bundle.internalFlags}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
