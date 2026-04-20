"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Lock, X, Plane, Plus, ChevronDown, Building2 } from "lucide-react";
import type { VIC, SharedAccess, TeamSharedAccess, TravelProfileType } from "@/types/vic";
import { getVICId, updateVIC } from "@/lib/vic-api";
import { FAKE_ITINERARIES } from "@/components/itineraries/fakeData";
import type { Itinerary } from "@/types/itinerary";
import { MOCK_DIRECTORY_PRODUCTS } from "@/components/products/productDirectoryMock";
import type { DetailTabId } from "./DetailTabBar";
import type { FieldProvenance } from "@/types/vic";
import AcuitySourceBadge from "./AcuitySourceBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { SendFormModal } from "@/components/itineraries/CompetitorFeatureModals";
import { useUser } from "@/contexts/UserContext";
import { useTeams } from "@/contexts/TeamsContext";
import { getItinerariesForVic, getProductsForVic } from "@/lib/entityCrossLinks";
import { canViewFinancials } from "@/utils/itineraryPermissions";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-foreground/[0.04] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-3">{title}</h3>
      <div className="text-sm text-[rgba(245,245,245,0.85)]">{children}</div>
    </div>
  );
}

function TravelProfilesInline({
  profiles,
  activeProfileType,
  onActiveProfileTypeChange,
  onAddTravelProfile,
  onEditTravelProfile,
}: {
  profiles: VIC["travel_profiles"];
  activeProfileType: TravelProfileType;
  onActiveProfileTypeChange: (t: TravelProfileType) => void;
  onAddTravelProfile?: () => void;
  onEditTravelProfile: () => void;
}) {
  const list = profiles ?? [];
  const activeProfile = list.find((p) => p.profile_type === activeProfileType);
  const hasProfile = (type: TravelProfileType) => list.some((p) => p.profile_type === type);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {ALL_TRAVEL_PROFILE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onActiveProfileTypeChange(type)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              activeProfileType === type
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                : hasProfile(type)
                  ? "bg-white/5 text-foreground/88 border border-input hover:border-white/20"
                  : "bg-foreground/[0.03] text-muted-foreground/70 border border-white/5 hover:border-input"
            )}
          >
            {profileTypeIcon(type)} {capitalize(type)}
            {hasProfile(type) && <span className="ml-1 text-green-400">●</span>}
          </button>
        ))}
      </div>

      {activeProfile ? (
        <div className="bg-white/[0.03] rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{capitalize(activeProfileType)}</span>
              {activeProfile.is_primary && (
                <span className="text-2xs text-[var(--color-warning)] bg-amber-500/10 px-1.5 py-0.5 rounded">PRIMARY</span>
              )}
            </div>
            <button type="button" className="text-xs text-blue-400 hover:text-blue-300" onClick={onEditTravelProfile}>
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {(activeProfile.accommodation_types?.length ?? 0) > 0 && (
              <div>
                <p className="text-2xs text-muted-foreground uppercase tracking-wider">Accommodation</p>
                <p className="text-xs text-foreground/88">
                  {(activeProfile.accommodation_types ?? []).join(", ")}
                </p>
              </div>
            )}
            {activeProfile.accommodation_preferences && !activeProfile.accommodation_types?.length && (
              <div>
                <p className="text-2xs text-muted-foreground uppercase tracking-wider">Accommodation</p>
                <p className="text-xs text-foreground/88">{activeProfile.accommodation_preferences}</p>
              </div>
            )}
            {(activeProfile.cuisine_preferences?.length ?? 0) > 0 && (
              <div>
                <p className="text-2xs text-muted-foreground uppercase tracking-wider">Cuisine</p>
                <p className="text-xs text-foreground/88">{(activeProfile.cuisine_preferences ?? []).join(", ")}</p>
              </div>
            )}
            {(activeProfile.cabin_class || activeProfile.travel_pace || activeProfile.pace) && (
              <>
                {activeProfile.cabin_class && (
                  <div>
                    <p className="text-2xs text-muted-foreground uppercase tracking-wider">Cabin</p>
                    <p className="text-xs text-foreground/88">{activeProfile.cabin_class}</p>
                  </div>
                )}
                {(activeProfile.travel_pace ?? activeProfile.pace) && (
                  <div>
                    <p className="text-2xs text-muted-foreground uppercase tracking-wider">Pace</p>
                    <p className="text-xs text-foreground/88">{activeProfile.travel_pace ?? activeProfile.pace}</p>
                  </div>
                )}
              </>
            )}
            {(activeProfile.budget_range ?? activeProfile.budget_tier) && (
              <div>
                <p className="text-2xs text-muted-foreground uppercase tracking-wider">Budget</p>
                <p className="text-xs text-foreground/88">{activeProfile.budget_range ?? activeProfile.budget_tier}</p>
              </div>
            )}
            {((activeProfile.destinations_preferred?.length ?? 0) > 0 || (activeProfile.destinations?.length ?? 0) > 0) && (
              <div className="col-span-2">
                <p className="text-2xs text-muted-foreground uppercase tracking-wider">Preferred Destinations</p>
                <p className="text-xs text-foreground/88">
                  {(activeProfile.destinations_preferred ?? activeProfile.destinations ?? []).join(", ")}
                </p>
              </div>
            )}
          </div>
          {activeProfile.source === "acuity" && (
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <p className="text-2xs text-violet-400 flex items-center gap-1">
                <span>✦</span> Some preferences enriched by Acuity
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-foreground/[0.03] rounded-xl p-4 border border-dashed border-input text-center">
          <p className="text-xs text-muted-foreground">No {capitalize(activeProfileType)} profile yet</p>
          {onAddTravelProfile && (
            <button
              type="button"
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
              onClick={onAddTravelProfile}
            >
              + Create {capitalize(activeProfileType)} Profile
            </button>
          )}
        </div>
      )}
      {list.length < 7 && onAddTravelProfile && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
          onClick={onAddTravelProfile}
        >
          <Plus className="w-3 h-3" /> Add another profile type
        </button>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  emptyLabel,
  acuityProvenance,
}: {
  label: string;
  value: React.ReactNode;
  emptyLabel?: string;
  acuityProvenance?: FieldProvenance;
}) {
  const showEmpty = emptyLabel != null;
  const isEmpty = value == null || value === "";
  if (isEmpty && !showEmpty) return null;
  const emptyClass = emptyLabel === "Not set" ? "text-muted-foreground/70 italic" : "text-muted-foreground";
  const display = isEmpty ? (showEmpty ? <span className={emptyClass}>{emptyLabel}</span> : null) : value;
  if (display == null) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-border last:border-0 items-center flex-wrap">
      <span className="text-muted-foreground/75 shrink-0 w-36">{label}</span>
      <span className="text-foreground break-words flex-1 min-w-0">{display}</span>
      {acuityProvenance && acuityProvenance.source === "acuity" && (
        <AcuitySourceBadge provenance={acuityProvenance} />
      )}
    </div>
  );
}

function formatDate(iso: string | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

function TravelDiscoveredPreferences({ discovered }: { discovered: import("@/types/vic").TravelDiscoveredPreference[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(true);
  const list = discovered.filter((d) => !hidden.has(d.id));
  if (list.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--muted-accent-border)] bg-[var(--muted-accent-bg)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-accent-text)]">AI-Discovered Preferences</h3>
        <span className="text-muted-foreground/75 text-sm">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {list.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <span className="text-sm text-foreground">{d.text}</span>
              {d.provider && (
                <AcuitySourceBadge provenance={{ source: "acuity", provider: d.provider, sourced_at: d.sourced_at }} />
              )}
              <div className="ml-auto flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[var(--muted-success-text)]" onClick={() => setHidden((s) => new Set(s).add(d.id))}>
                  Accept
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setHidden((s) => new Set(s).add(d.id))}>
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RelationshipInsightsWithActions({ insights }: { insights: import("@/types/vic").RelationshipInsight[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const list = insights.filter((i) => !dismissed.has(i.id));
  if (list.length === 0) return null;
  return (
    <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-300 mb-3">Acuity Intelligence Insights</h3>
      <ul className="space-y-2 text-sm">
        {list.map((insight) => (
          <li key={insight.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <span className="text-foreground flex-1 min-w-0">• {insight.text}</span>
            {insight.provider && (
              <AcuitySourceBadge
                provenance={{ source: "acuity", provider: insight.provider, sourced_at: insight.sourced_at }}
              />
            )}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-[var(--muted-success-text)]" onClick={() => setDismissed((s) => new Set(s).add(insight.id))}>
                Accept
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setDismissed((s) => new Set(s).add(insight.id))}>
                Dismiss
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SHARING_LEVELS: { value: VIC["sharing_level"]; label: string; desc: string }[] = [
  { value: "none", label: "None", desc: "Only you can see this VIC." },
  { value: "full", label: "Full", desc: "Shared advisors see all details (subject to access level)." },
];

const MOCK_ADVISORS = [
  { id: "2", name: "Marie Limousis" },
  { id: "3", name: "Pierre Duval" },
  { id: "4", name: "Claire Martin" },
];

function SharingTabContent({ vic, onSaved }: { vic: VIC; onSaved: () => void }) {
  const { user } = useUser();
  const { teams } = useTeams();
  const toast = useToast();
  const [level, setLevel] = useState<VIC["sharing_level"]>(vic.sharing_level ?? "none");
  const [publishToAgency, setPublishToAgency] = useState(!!vic.is_shared_to_agency);
  const [sharedWith, setSharedWith] = useState<SharedAccess[]>(vic.shared_with ?? []);
  const [sharedWithTeams, setSharedWithTeams] = useState<TeamSharedAccess[]>(vic.shared_with_teams ?? []);
  const [addAdvisorOpen, setAddAdvisorOpen] = useState(false);
  const [newAdvisorId, setNewAdvisorId] = useState("");
  const [newAccessLevel, setNewAccessLevel] = useState<"view" | "edit">("view");
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [newTeamId, setNewTeamId] = useState("");
  const [newTeamAccessLevel, setNewTeamAccessLevel] = useState<"view" | "edit">("view");
  const [savingShare, setSavingShare] = useState(false);

  const teamOptions = useMemo(() => {
    const uid = user?.id != null ? String(user.id) : "";
    return teams.filter((t) => t.isDefault || (uid && t.memberIds.some((m) => String(m) === uid)));
  }, [teams, user?.id]);

  useEffect(() => {
    setLevel(vic.sharing_level ?? "none");
    setPublishToAgency(!!vic.is_shared_to_agency);
    setSharedWith(vic.shared_with ?? []);
    setSharedWithTeams(vic.shared_with_teams ?? []);
  }, [vic.id, vic.sharing_level, vic.is_shared_to_agency, vic.shared_with, vic.shared_with_teams]);

  const addAdvisor = () => {
    if (!newAdvisorId) return;
    const advisor = MOCK_ADVISORS.find((a) => a.id === newAdvisorId);
    if (advisor && !sharedWith.some((s) => String(s.advisor_id) === advisor.id)) {
      setSharedWith([...sharedWith, { advisor_id: advisor.id, advisor_name: advisor.name, access_level: newAccessLevel, shared_at: new Date().toISOString() }]);
      setNewAdvisorId("");
      setAddAdvisorOpen(false);
    }
  };

  const removeAdvisor = (advisorId: string) => {
    setSharedWith(sharedWith.filter((s) => String(s.advisor_id) !== advisorId));
  };

  const setAdvisorAccess = (advisorId: string, access_level: "view" | "edit") => {
    setSharedWith(sharedWith.map((s) => (String(s.advisor_id) === advisorId ? { ...s, access_level } : s)));
  };

  const addTeam = () => {
    if (!newTeamId) return;
    const team = teamOptions.find((t) => t.id === newTeamId);
    if (team && !sharedWithTeams.some((s) => s.team_id === team.id)) {
      setSharedWithTeams([
        ...sharedWithTeams,
        {
          team_id: team.id,
          team_name: team.name,
          access_level: newTeamAccessLevel,
          shared_at: new Date().toISOString(),
        },
      ]);
      setNewTeamId("");
      setAddTeamOpen(false);
    }
  };

  const removeTeam = (teamId: string) => {
    setSharedWithTeams(sharedWithTeams.filter((s) => s.team_id !== teamId));
  };

  const setTeamAccess = (teamId: string, access_level: "view" | "edit") => {
    setSharedWithTeams(sharedWithTeams.map((s) => (s.team_id === teamId ? { ...s, access_level } : s)));
  };

  const handleSaveSharing = async () => {
    setSavingShare(true);
    try {
      await updateVIC(getVICId(vic), {
        sharing_level: level ?? "none",
        shared_with: sharedWith,
        shared_with_teams: sharedWithTeams,
        is_shared_to_agency: publishToAgency,
      });
      toast({ title: "Sharing saved", tone: "success" });
      onSaved();
    } catch (e) {
      toast({
        title: "Could not save sharing",
        description: e instanceof Error ? e.message : undefined,
        tone: "destructive",
      });
    } finally {
      setSavingShare(false);
    }
  };

  return (
    <div className="space-y-4">
      <Section title="Sharing level">
        <p className="text-xs text-muted-foreground/75 mb-3">Choose how much shared advisors can see.</p>
        <div className="flex flex-wrap gap-2">
          {SHARING_LEVELS.map((opt) => (
            <button
              key={opt.value ?? "none"}
              type="button"
              onClick={() => setLevel(opt.value ?? "none")}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                level === opt.value
                  ? "border-[#F5F5F5] bg-white/10 text-foreground"
                  : "border-input bg-white/5 text-muted-foreground hover:border-white/20"
              )}
            >
              <span className="font-medium block">{opt.label}</span>
              <span className="text-xs text-muted-foreground/75">{opt.desc}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Share with advisors">
        <div className="space-y-2">
          {sharedWith.length === 0 ? (
            <p className="text-sm text-muted-foreground/75">No advisors shared yet.</p>
          ) : (
            sharedWith.map((s) => (
              <div key={s.advisor_id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                <span className="flex-1 text-sm text-foreground">{s.advisor_name ?? s.advisor_id}</span>
                <Select value={s.access_level} onValueChange={(v) => setAdvisorAccess(s.advisor_id, v as "view" | "edit")}>
                  <SelectTrigger className="w-28 h-8 bg-white/5 border-input text-foreground text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground/75">{s.shared_at ? formatDate(s.shared_at) : ""}</span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/75 hover:text-[var(--muted-error-text)]" onClick={() => removeAdvisor(s.advisor_id)}>
                  <X size={14} />
                </Button>
              </div>
            ))
          )}
          {!addAdvisorOpen ? (
            <Button type="button" variant="outline" size="sm" className="border-input text-foreground" onClick={() => setAddAdvisorOpen(true)}>
              Add Advisor
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input p-3">
              <Select value={newAdvisorId || undefined} onValueChange={setNewAdvisorId}>
                <SelectTrigger className="w-40 bg-white/5 border-input text-foreground">
                  <SelectValue placeholder="Select advisor" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ADVISORS.filter((a) => !sharedWith.some((s) => String(s.advisor_id) === a.id)).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newAccessLevel} onValueChange={(v) => setNewAccessLevel(v as "view" | "edit")}>
                <SelectTrigger className="w-24 bg-white/5 border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addAdvisor}>Add</Button>
              <Button variant="ghost" size="sm" onClick={() => setAddAdvisorOpen(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </Section>
      <Section title="Share with teams">
        <p className="text-xs text-muted-foreground/75 mb-3">
          All current and future members of a team receive access at the level you choose.
        </p>
        <div className="space-y-2">
          {sharedWithTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground/75">No teams shared yet.</p>
          ) : (
            sharedWithTeams.map((s) => (
              <div key={s.team_id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                <span className="flex-1 text-sm text-foreground">{s.team_name ?? s.team_id}</span>
                <Select value={s.access_level} onValueChange={(v) => setTeamAccess(s.team_id, v as "view" | "edit")}>
                  <SelectTrigger className="w-28 h-8 bg-white/5 border-input text-foreground text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground/75">{s.shared_at ? formatDate(s.shared_at) : ""}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/75 hover:text-[var(--muted-error-text)]"
                  onClick={() => removeTeam(s.team_id)}
                >
                  <X size={14} />
                </Button>
              </div>
            ))
          )}
          {!addTeamOpen ? (
            <Button type="button" variant="outline" size="sm" className="border-input text-foreground" onClick={() => setAddTeamOpen(true)}>
              Add team
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input p-3">
              <Select value={newTeamId || undefined} onValueChange={setNewTeamId}>
                <SelectTrigger className="w-48 bg-white/5 border-input text-foreground">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teamOptions
                    .filter((t) => !sharedWithTeams.some((s) => s.team_id === t.id))
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={newTeamAccessLevel} onValueChange={(v) => setNewTeamAccessLevel(v as "view" | "edit")}>
                <SelectTrigger className="w-24 bg-white/5 border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addTeam}>
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAddTeamOpen(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Section>
      <Section title="Agency visibility">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-foreground">Publish to Agency Directory</Label>
            <p className="text-xs text-muted-foreground/75 mt-0.5">Other agency advisors can discover this VIC (read-only).</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={publishToAgency}
            onClick={() => setPublishToAgency(!publishToAgency)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors",
              publishToAgency ? "bg-[var(--muted-success-bg)] border-[var(--muted-success-border)]" : "bg-white/10 border-white/20"
            )}
          >
            <span className={cn("pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", publishToAgency ? "translate-x-5" : "translate-x-0.5")} style={{ marginTop: 2 }} />
          </button>
        </div>
      </Section>
      <div className="flex justify-end pt-2">
        <Button type="button" size="sm" variant="toolbarAccent" disabled={savingShare} onClick={handleSaveSharing}>
          {savingShare ? "Saving…" : "Save sharing"}
        </Button>
      </div>
    </div>
  );
}

const ALL_TRAVEL_PROFILE_TYPES: TravelProfileType[] = [
  "business",
  "leisure",
  "romantic",
  "adventure",
  "wellness",
  "cultural",
  "celebration",
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

function profileTypeIcon(_type: TravelProfileType) {
  return <Plane className="w-3.5 h-3.5 text-muted-foreground/75" />;
}

type Props = {
  vic: VIC;
  activeTab: DetailTabId;
  canViewSensitive: boolean;
  onUpdate: () => void;
  travelProfiles?: VIC["travel_profiles"];
  onAddTravelProfile?: () => void;
  showTravelProfiles?: boolean;
  onShowTravelProfilesChange?: (show: boolean) => void;
  travelSectionRef?: React.RefObject<HTMLDivElement | null>;
};

export default function DetailTabContent({
  vic,
  activeTab,
  canViewSensitive,
  onUpdate,
  travelProfiles: travelProfilesProp,
  onAddTravelProfile,
  showTravelProfiles = false,
  onShowTravelProfilesChange,
  travelSectionRef,
}: Props) {
  const showToast = useToast();
  const { user } = useUser();
  const canViewItineraryFinancials = canViewFinancials(
    user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null
  );
  const [sendFormOpen, setSendFormOpen] = useState(false);
  const [preferredProductsOpen, setPreferredProductsOpen] = useState(false);
  const [travelHistoryOpen, setTravelHistoryOpen] = useState(false);
  const [activeProfileType, setActiveProfileType] = useState<TravelProfileType>("business");
  const leg = vic as unknown as { city?: string; country?: string; company?: string; role?: string; phone?: string; customTags?: string[]; notes?: string; familyContext?: string; preferences?: string; loyaltyPrograms?: string; additionalContext?: string };
  const vicId = getVICId(vic);

  if (activeTab === "overview") {
    const location = [vic.home_city ?? leg.city, vic.home_country ?? leg.country].filter(Boolean).join(", ");
    const contact = [vic.email, vic.phone_primary ?? leg.phone].filter(Boolean).join(" · ");
    const tags = vic.tags ?? leg.customTags ?? [];
    const provenance = vic.field_provenance ?? {};
    const acuityLastRun = vic.acuity_last_run ?? (vic as unknown as { acuityLastRun?: string }).acuityLastRun;
    const acuityProvider = vic.acuity_provider ?? "—";
    const acuityConfidence = vic.acuity_confidence ?? "—";
    const acuityEntries = Object.entries(provenance).filter(([, p]) => p?.source === "acuity");
    const enrichedCount = acuityEntries.length;
    const totalFields = 40;
    const completeness = Math.min(100, Math.round((enrichedCount / totalFields) * 100));
    const acuityDaysAgo = acuityLastRun ? Math.floor((Date.now() - new Date(acuityLastRun).getTime()) / (24 * 60 * 60 * 1000)) : null;
    const providerCounts: Record<string, number> = {};
    const confScores: number[] = [];
    const w = { high: 1, medium: 0.66, low: 0.33 } as const;
    acuityEntries.forEach(([, p]) => {
      const pr = (p.provider ?? "unknown").toLowerCase();
      const label = pr === "gemini" ? "Gemini" : pr === "perplexity" ? "Perplexity" : pr === "claude" ? "Claude" : p.provider ?? "—";
      providerCounts[label] = (providerCounts[label] ?? 0) + 1;
      confScores.push(w[p.confidence ?? "medium"] ?? 0.66);
    });
    const avgConfPct = confScores.length ? Math.round((confScores.reduce((a, b) => a + b, 0) / confScores.length) * 100) : 0;
    const providerBreakdown = Object.entries(providerCounts)
      .map(([name, n]) => `${name}: ${n}`)
      .join(" · ");
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-300 mb-3">Acuity Intelligence Summary</h3>
          {acuityLastRun ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-[rgba(245,245,245,0.85)]">Last run: {formatDate(acuityLastRun) ?? acuityLastRun}</span>
                <span className="text-[rgba(245,245,245,0.85)]">Primary run: {acuityProvider}</span>
                <span className="text-[rgba(245,245,245,0.85)]">Headline confidence: {String(acuityConfidence).charAt(0).toUpperCase() + String(acuityConfidence).slice(1)}</span>
              </div>
              <p className="text-xs text-[rgba(245,245,245,0.65)]">
                <span className="text-violet-300/90 font-medium">{enrichedCount}</span> fields enriched by Acuity
                {providerBreakdown ? (
                  <>
                    {" · "}
                    {providerBreakdown}
                  </>
                ) : null}
              </p>
              <p className="text-xs text-[rgba(245,245,245,0.65)]">
                Estimated overall confidence (avg. across enriched fields):{" "}
                <span className="text-emerald-400/90 font-medium">{avgConfPct}%</span>
              </p>
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-2 rounded-full border border-violet-500/20 bg-white/10 overflow-hidden max-w-[160px]">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: completeness + "%" }} />
                </div>
                <span className="text-xs text-muted-foreground">Coverage ~{completeness}% of enrichable field set</span>
              </div>
              {acuityDaysAgo != null && acuityDaysAgo > 30 && (
                <Button variant="outline" size="sm" className="border-violet-500/30 text-violet-300 mt-2" onClick={onUpdate}>
                  Refresh
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-2">Acuity has not been run yet. Run Acuity from the header to enrich this profile.</p>
          )}
        </div>
        <Section title="At a Glance">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row label="Preferred name" value={vic.preferred_name} acuityProvenance={provenance.preferred_name} />
            <Row label="Primary contact" value={contact || undefined} />
            <Row label="Location" value={location || undefined} acuityProvenance={provenance.home_city || provenance.home_country} />
            <Row label="Company" value={vic.company ?? leg.company} emptyLabel="Not set" />
            <Row label="Title / role" value={vic.title ?? leg.role} emptyLabel="Not set" acuityProvenance={provenance.title} />
            <Row label="VIC since" value={vic.vic_since ? formatDate(vic.vic_since) ?? vic.vic_since : undefined} />
            <Row label="Relationship status" value={vic.relationship_status?.replace(/_/g, " ") ?? undefined} />
            <Row label="Last Acuity run" value={acuityLastRun ? (formatDate(acuityLastRun) ?? acuityLastRun) : undefined} />
          </div>
        </Section>
        {tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="text-xs lowercase border border-border text-muted-foreground/90 rounded-full px-2 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}
        {vic.vip_notes && (
          <Section title="VIP notes">
            <p className="whitespace-pre-wrap">{vic.vip_notes}</p>
          </Section>
        )}

        {/* Travel Profiles — collapsible section at bottom of Overview */}
        <div ref={travelSectionRef} className="border-t border-border pt-5 mt-5">
          <button
            type="button"
            onClick={() => onShowTravelProfilesChange?.(!showTravelProfiles)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-muted-foreground/90" />
              <span className="text-sm font-medium text-white">Travel Profiles</span>
              <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                {(travelProfilesProp ?? vic.travel_profiles ?? []).length} of 7
              </span>
            </div>
            <ChevronDown
              className={cn("w-4 h-4 text-muted-foreground transition-transform", showTravelProfiles && "rotate-180")}
            />
          </button>

          {showTravelProfiles && (
            <TravelProfilesInline
              profiles={travelProfilesProp ?? vic.travel_profiles ?? []}
              activeProfileType={activeProfileType}
              onActiveProfileTypeChange={setActiveProfileType}
              onAddTravelProfile={onAddTravelProfile}
              onEditTravelProfile={() => showToast("Travel profile editor — available in the next release")}
            />
          )}
        </div>
      </div>
    );
  }

  if (activeTab === "identity") {
    const prov = vic.field_provenance ?? {};
    const dobValue: React.ReactNode = !vic.date_of_birth
      ? undefined
      : canViewSensitive
        ? (formatDate(vic.date_of_birth) ?? vic.date_of_birth)
        : <span className="inline-flex items-center gap-1.5"><Lock size={12} className="text-muted-foreground/75" />••/••/••••</span>;
    const addressValue: React.ReactNode = !vic.home_address
      ? undefined
      : canViewSensitive
        ? vic.home_address
        : <span className="inline-flex items-center gap-1.5"><Lock size={12} className="text-muted-foreground/75" />••••••••••••</span>;
    return (
      <div className="space-y-4">
        <Section title="Contact">
          <div className="space-y-0">
            <Row label="Full name" value={vic.full_name} emptyLabel="Not set" />
            <Row label="Email" value={vic.email} emptyLabel="Not set" />
            <Row label="Email (secondary)" value={vic.email_secondary} emptyLabel="Not set" />
            <Row label="Phone (primary)" value={vic.phone_primary ?? leg.phone} emptyLabel="Not set" />
            <Row label="Phone (secondary)" value={vic.phone_secondary} emptyLabel="Not set" />
          </div>
        </Section>
        <Section title="Personal">
          <div className="space-y-0">
            <Row label="Company" value={vic.company ?? leg.company} emptyLabel="Not set" />
            <Row label="Title" value={vic.title} emptyLabel="Not set" acuityProvenance={prov.title} />
            <Row label="Preferred name" value={vic.preferred_name} emptyLabel="Not set" acuityProvenance={prov.preferred_name} />
            <Row label="Nationality" value={vic.nationality} emptyLabel="Not set" acuityProvenance={prov.nationality?.source === "acuity" ? prov.nationality : undefined} />
            <Row label="Date of birth" value={dobValue} emptyLabel="Not set" acuityProvenance={prov.date_of_birth} />
            <Row label="Primary language" value={vic.language_primary} emptyLabel="Not set" acuityProvenance={prov.language_primary} />
            <Row
              label="Languages spoken"
              value={vic.languages_spoken?.length ? vic.languages_spoken.join(", ") : undefined}
              emptyLabel="Not set"
              acuityProvenance={prov.languages_spoken}
            />
          </div>
        </Section>
        <Section title="Location">
          <div className="space-y-0">
            <Row label="Home address" value={addressValue} emptyLabel="Not set" />
            <Row label="City" value={vic.home_city ?? leg.city} emptyLabel="Not set" acuityProvenance={prov.home_city} />
            <Row label="Country" value={vic.home_country ?? leg.country} emptyLabel="Not set" acuityProvenance={prov.home_country} />
            <Row label="Time zone" value={vic.time_zone} emptyLabel="Not set" acuityProvenance={prov.time_zone} />
          </div>
        </Section>
      </div>
    );
  }

  if (activeTab === "relationship") {
    const statusBadge = vic.relationship_status ? (
      <span
        className={[
          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
          vic.relationship_status === "active" && "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border border-[var(--muted-success-border)]",
          vic.relationship_status === "inactive" && "bg-[rgba(245,245,245,0.15)] text-muted-foreground",
          vic.relationship_status === "prospect" && "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]",
          vic.relationship_status === "past" && "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border border-[var(--muted-amber-border)]",
          vic.relationship_status === "do_not_contact" && "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border border-[var(--muted-error-border)]",
        ].filter(Boolean).join(" ") || "bg-white/10 text-muted-foreground"}
      >
        {vic.relationship_status.replace(/_/g, " ")}
      </span>
    ) : undefined;
    const referredByLink = vic.referred_by_vic_id ? (
      <Link href={`/dashboard/vics/${vic.referred_by_vic_id}`} className="text-[rgba(245,245,245,0.9)] hover:underline">
        {vic.referred_by_vic_name ?? vic.referred_by_vic_id}
      </Link>
    ) : undefined;
    const insights = vic.relationship_insights ?? [];
    return (
      <div className="space-y-4">
        <Section title="Relationship">
          <div className="space-y-0">
            <Row label="Assigned advisor" value={vic.assigned_advisor_name ?? vic.assigned_advisor_id} emptyLabel="Not set" />
            <Row label="Secondary advisor" value={vic.secondary_advisor_name ?? vic.secondary_advisor_id} emptyLabel="Not set" />
            <Row label="VIC since" value={vic.vic_since ? formatDate(vic.vic_since) ?? vic.vic_since : undefined} emptyLabel="Not set" />
            <Row label="Referral source" value={vic.referral_source} emptyLabel="Not set" />
            <Row label="Referred by VIC" value={referredByLink} emptyLabel="Not set" />
            <div className="flex gap-2 py-1.5 border-b border-border items-center">
              <span className="text-muted-foreground/75 shrink-0 w-36">Relationship status</span>
              {statusBadge ?? <span className="text-muted-foreground/70 italic">Not set</span>}
            </div>
            <div className="py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground/75 block w-36 mb-1">VIP notes</span>
              <p className="whitespace-pre-wrap text-foreground">{vic.vip_notes || <span className="text-muted-foreground/70 italic">Not set</span>}</p>
            </div>
          </div>
        </Section>
        {insights.length > 0 && (
          <RelationshipInsightsWithActions insights={insights} />
        )}
      </div>
    );
  }

  if (activeTab === "preferences") {
    const notes = vic.notes ?? leg.notes;
    const provPref = vic.field_provenance ?? {};
    const leisureKeys = Object.keys(provPref).filter((k) => k.startsWith("leisure.") && provPref[k]?.source === "acuity");
    const LEISURE_LABELS: Record<string, string> = {
      "leisure.accommodation_types": "Accommodation types",
      "leisure.accommodation_style": "Accommodation style",
      "leisure.cuisine_preferences": "Cuisine preferences",
      "leisure.dining_style": "Dining style",
      "leisure.experience_themes": "Experience themes",
      "leisure.activities_loved": "Activities loved",
      "leisure.travel_pace": "Travel pace",
      "leisure.budget_range": "Budget range",
      "leisure.preferred_airlines": "Preferred airlines",
      "leisure.cabin_class": "Cabin class",
      "leisure.destinations_preferred": "Destinations preferred",
      "leisure.destinations_visited": "Destinations visited",
      "leisure.best_for_occasions": "Best for occasions",
    };
    return (
      <div className="space-y-4">
        <Section title="Preferences & tags">
          <div className="space-y-0">
            {(vic.tags ?? leg.customTags ?? []).length > 0 && (
              <div className="py-1.5 border-b border-border">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-muted-foreground/75 w-36 shrink-0">Tags</span>
                  {provPref.customTags?.source === "acuity" && <AcuitySourceBadge provenance={provPref.customTags} fieldLabel="Tags" />}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(vic.tags ?? leg.customTags ?? []).map((t: string) => (
                    <span key={t} className="text-xs lowercase border border-border text-muted-foreground/90 rounded-full px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            )}
            <Row label="Dietary restrictions" value={vic.dietary_restrictions} />
            <Row label="Accessibility needs" value={vic.accessibility_needs} />
            <Row label="GDPR consent" value={vic.gdpr_consent_given == null ? undefined : vic.gdpr_consent_given ? "Yes" : "No"} />
            <Row label="Marketing consent" value={vic.marketing_consent == null ? undefined : vic.marketing_consent ? "Yes" : "No"} />
          </div>
        </Section>
        {notes && (
          <Section title="Notes">
            <p className="whitespace-pre-wrap">{notes}</p>
          </Section>
        )}
        {leisureKeys.length > 0 && (
          <Section title="Travel preferences (Acuity · leisure)">
            <p className="text-xs text-muted-foreground/75 mb-3">
              Fields discovered from public sources. Review excerpts via each badge.
            </p>
            <div className="space-y-0">
              {leisureKeys.sort().map((key) => {
                const p = provPref[key];
                if (!p || p.source !== "acuity") return null;
                const excerpt = p.raw_excerpt ?? "—";
                return (
                  <Row
                    key={key}
                    label={LEISURE_LABELS[key] ?? key.replace("leisure.", "")}
                    value={excerpt.length > 120 ? `${excerpt.slice(0, 117)}…` : excerpt}
                    acuityProvenance={p}
                  />
                );
              })}
            </div>
          </Section>
        )}
        {leg.familyContext && (
          <Section title="Family context">
            <div className="flex flex-wrap items-start gap-2">
              <p className="whitespace-pre-wrap flex-1 min-w-0">{leg.familyContext}</p>
              {provPref.familyContext?.source === "acuity" && <AcuitySourceBadge provenance={provPref.familyContext} fieldLabel="Family context" />}
            </div>
          </Section>
        )}
        <Section title="Documents">
          {canViewSensitive ? (
            <div className="space-y-3">
              <div className="space-y-0">
                <Row label="Passport number" value={vic.passport_number ? (typeof vic.passport_number === "string" && vic.passport_number.startsWith("****") ? vic.passport_number : "****" + String(vic.passport_number).slice(-4)) : undefined} emptyLabel="Not set" />
                <Row label="Passport country" value={vic.passport_country} emptyLabel="Not set" />
                <Row
                  label="Passport expiry"
                  value={
                    vic.passport_expiry
                      ? (() => {
                          try {
                            const exp = new Date(vic.passport_expiry).getTime();
                            if (Number.isNaN(exp)) return formatDate(vic.passport_expiry) ?? vic.passport_expiry;
                            const in180 = exp - Date.now() < 180 * 24 * 60 * 60 * 1000;
                            const fmt = formatDate(vic.passport_expiry) ?? vic.passport_expiry;
                            return in180 ? <span className="text-[var(--muted-amber-text)]">{fmt} (expires soon)</span> : fmt;
                          } catch {
                            return formatDate(vic.passport_expiry) ?? vic.passport_expiry;
                          }
                        })()
                      : undefined
                  }
                  emptyLabel="Not set"
                />
                <Row label="Known traveler number" value={vic.known_traveler_number ? (typeof vic.known_traveler_number === "string" && vic.known_traveler_number.startsWith("****") ? vic.known_traveler_number : "****" + String(vic.known_traveler_number).slice(-4)) : undefined} emptyLabel="Not set" />
                {provPref.loyalty_programs?.source === "acuity" && (
                  <Row
                    label="Loyalty signals (Acuity)"
                    value="Cross-check listed programs with the VIC — inferred from public mentions"
                    acuityProvenance={provPref.loyalty_programs}
                  />
                )}
              </div>
              {vic.loyalty_programs && vic.loyalty_programs.length > 0 && (
                <div className="py-1.5">
                  <span className="text-muted-foreground/75 block w-36 mb-1">Loyalty programs</span>
                  <ul className="space-y-2">
                    {vic.loyalty_programs.map((lp) => (
                      <li key={lp.id} className="flex items-center justify-between rounded bg-white/5 px-2 py-1.5 text-sm">
                        <span className="text-foreground">{lp.program_name}</span>
                        <span className="text-muted-foreground">{lp.membership_id ?? "***----"}</span>
                        {lp.tier && <span className="text-xs text-muted-foreground/75">{lp.tier}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" className="border-input text-foreground">
                  Add Document
                </Button>
                <Button type="button" variant="outline" size="sm" className="border-input text-foreground">
                  Add Loyalty Program
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground/75">Document details are restricted. You need full access to view.</p>
          )}
        </Section>

        <Section title="VIC forms">
          {vicId === "vic-001" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-foreground">📋 Travel Preferences Form</span>
                  <span className="text-2xs uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400">Completed</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Submitted 12 Mar 2026</p>
                <Button type="button" variant="outline" size="sm" className="mt-2 border-input text-xs h-8">
                  View Responses
                </Button>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-foreground">📋 Passport & Documents</span>
                  <span className="text-2xs uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30 text-[var(--color-warning)]">Pending</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sent 10 Mar 2026 · Not yet submitted</p>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="outline" size="sm" className="border-input text-xs h-8">
                    Resend
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="border-input text-xs h-8">
                    View Form
                  </Button>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="border-input" onClick={() => setSendFormOpen(true)}>
                + Send New Form
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No forms sent yet</p>
              <Button type="button" variant="outline" size="sm" className="border-input" onClick={() => setSendFormOpen(true)}>
                Send a form
              </Button>
            </div>
          )}
        </Section>

        <SendFormModal
          open={sendFormOpen}
          onClose={() => setSendFormOpen(false)}
          vicName={vic.full_name ?? "VIC"}
          onSend={() => {
            showToast("Form sent to jc@example.com");
            setSendFormOpen(false);
          }}
        />
      </div>
    );
  }

  if (activeTab === "linked_entities") {
    const vicId = getVICId(vic);
    const preferredProducts = getProductsForVic(
      vicId,
      FAKE_ITINERARIES ?? [],
      MOCK_DIRECTORY_PRODUCTS ?? [],
      [vic]
    );
    const linkedItineraries = getItinerariesForVic(vicId, FAKE_ITINERARIES ?? []);
    const priceFmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
    return (
      <div className="space-y-4">
        <Section title="">
          <button type="button" onClick={() => setPreferredProductsOpen((v) => !v)} className="mb-2 flex w-full items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
              Preferred Products
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {preferredProducts.length}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", preferredProductsOpen && "rotate-180")} />
            </span>
          </button>
          {preferredProductsOpen ? preferredProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No preferred products linked yet.</p>
          ) : (
            <div className="space-y-2">
              {preferredProducts.map((link) => {
                const product = MOCK_DIRECTORY_PRODUCTS.find((p) => p.id === link.productId);
                const stars = Math.max(0, Math.min(5, product?.starRating ?? 0));
                return (
                  <Link key={link.productId} href={`/dashboard/products?selected=${link.productId}`} className="flex items-center gap-2 rounded-lg border border-border bg-foreground/[0.04] p-2 text-sm hover:bg-white/[0.04]">
                    {product?.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-6 w-6 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/[0.05]">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{link.productName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {"★".repeat(stars)}
                        {stars > 0 ? " · " : ""}
                        {link.visitCount} {link.visitCount === 1 ? "stay" : "stays"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </Section>
        <Section title="">
          <button type="button" onClick={() => setTravelHistoryOpen((v) => !v)} className="mb-2 flex w-full items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
              Travel History
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {linkedItineraries.length}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", travelHistoryOpen && "rotate-180")} />
            </span>
          </button>
          {travelHistoryOpen ? linkedItineraries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No travel history linked yet.</p>
          ) : (
            <div className="space-y-2">
              {linkedItineraries.map((it) => {
                const eventCount = it.days?.reduce((acc, d) => acc + (d.events?.length ?? 0), 0) ?? 0;
                const prettyDate = (() => {
                  if (!it.trip_start_date || !it.trip_end_date) return it.trip_start_date ?? "—";
                  const s = new Date(it.trip_start_date);
                  const e = new Date(it.trip_end_date);
                  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${it.trip_start_date} – ${it.trip_end_date}`;
                  const month = s.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
                  const year = e.toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" });
                  return `${month} ${s.getUTCDate()}–${e.getUTCDate()}, ${year}`;
                })();
                return (
                  <Link key={it.id} href={`/dashboard/itineraries?selected=${it.id}`} className="block rounded-lg border border-border bg-foreground/[0.04] p-3 text-sm hover:bg-white/[0.04]">
                    <p className="font-medium text-foreground">{it.trip_name ?? it.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {prettyDate} · {eventCount} events
                      {canViewItineraryFinancials && it.total_vic_price != null
                        ? ` · ${priceFmt.format(it.total_vic_price)}`
                        : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </Section>
      </div>
    );
  }

  if (activeTab === "sharing") {
    return <SharingTabContent vic={vic} onSaved={onUpdate} />;
  }

  if (activeTab === "governance") {
    const ownership = vic.data_ownership_level ?? "personal";
    const ownershipBadge = ownership === "agency" ? "Agency" : ownership === "personal" ? "Advisor" : "Enable";
    const lockedFields = vic.field_locks ? Object.entries(vic.field_locks).filter(([, v]) => v).map(([k]) => k) : [];
    const editHistory = (vic as { edit_history?: { by: string; at: string; change: string }[] }).edit_history ?? [];
    return (
      <div className="space-y-4">
        <Section title="Data ownership">
          <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-[rgba(245,245,245,0.9)] capitalize">
            {ownershipBadge}
          </span>
        </Section>
        <Section title="Audit">
          <div className="space-y-0">
            <Row label="Created by" value={vic.created_by_name ?? (vic as { createdByName?: string }).createdByName ?? vic.created_by} emptyLabel="—" />
            <Row label="Created at" value={vic.created_at ? formatDate(vic.created_at) ?? vic.created_at : undefined} emptyLabel="—" />
            <Row label="Last edited by" value={vic.updated_by_name ?? vic.updated_by} emptyLabel="—" />
            <Row label="Modified at" value={vic.updated_at ? formatDate(vic.updated_at) ?? vic.updated_at : undefined} emptyLabel="—" />
          </div>
        </Section>
        {lockedFields.length > 0 && (
          <Section title="Locked fields">
            <ul className="list-disc pl-4 text-sm text-[rgba(245,245,245,0.85)]">
              {lockedFields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Section>
        )}
        <Section title="Edit history">
          {editHistory.length === 0 ? (
            <p className="text-muted-foreground/75 text-sm">No edit history available.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {editHistory.slice(0, 10).map((e, i) => (
                <li key={i} className="border-b border-border pb-2 last:border-0">
                  <span className="text-foreground">{e.change ?? "Updated"}</span>
                  <span className="text-muted-foreground/75 ml-2">— {e.by} · {e.at ? formatDate(e.at) ?? e.at : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="GDPR">
          <div className="space-y-0">
            <Row label="GDPR consent" value={vic.gdpr_consent_given == null ? undefined : vic.gdpr_consent_given ? "Yes" : "No"} emptyLabel="—" />
            <Row label="GDPR consent date" value={vic.gdpr_consent_date ? formatDate(vic.gdpr_consent_date) ?? vic.gdpr_consent_date : undefined} emptyLabel="—" />
            <Row label="Marketing consent" value={vic.marketing_consent == null ? undefined : vic.marketing_consent ? "Yes" : "No"} emptyLabel="—" />
            <Row label="Data retention until" value={vic.data_retention_until ? formatDate(vic.data_retention_until) ?? vic.data_retention_until : undefined} emptyLabel="—" />
          </div>
        </Section>
      </div>
    );
  }

  return null;
}
