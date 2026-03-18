"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import type { VIC, SharedAccess } from "@/types/vic";
import { getVICId } from "@/lib/vic-api";
import { FAKE_ITINERARIES } from "@/components/itineraries/fakeData";
import { FAKE_PRODUCTS } from "@/components/products/fakeData";
import type { Product } from "@/types/product";
import type { Itinerary } from "@/types/itinerary";
import { CATEGORY_ICONS } from "@/config/productCategoryConfig";
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-3">{title}</h3>
      <div className="text-sm text-[rgba(245,245,245,0.85)]">{children}</div>
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
  const emptyClass = emptyLabel === "Not set" ? "text-gray-600 italic" : "text-[rgba(245,245,245,0.4)]";
  const display = isEmpty ? (showEmpty ? <span className={emptyClass}>{emptyLabel}</span> : null) : value;
  if (display == null) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-[rgba(255,255,255,0.06)] last:border-0 items-center flex-wrap">
      <span className="text-[rgba(245,245,245,0.5)] shrink-0 w-36">{label}</span>
      <span className="text-[#F5F5F5] break-words flex-1 min-w-0">{display}</span>
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
        <span className="text-[rgba(245,245,245,0.5)] text-sm">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {list.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <span className="text-sm text-[#F5F5F5]">{d.text}</span>
              {d.provider && (
                <AcuitySourceBadge provenance={{ source: "acuity", provider: d.provider, sourced_at: d.sourced_at }} />
              )}
              <div className="ml-auto flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[var(--muted-success-text)]" onClick={() => setHidden((s) => new Set(s).add(d.id))}>
                  Accept
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[rgba(245,245,245,0.6)]" onClick={() => setHidden((s) => new Set(s).add(d.id))}>
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
            <span className="text-[#F5F5F5] flex-1 min-w-0">• {insight.text}</span>
            {insight.provider && (
              <AcuitySourceBadge
                provenance={{ source: "acuity", provider: insight.provider, sourced_at: insight.sourced_at }}
              />
            )}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-[var(--muted-success-text)]" onClick={() => setDismissed((s) => new Set(s).add(insight.id))}>
                Accept
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-[rgba(245,245,245,0.6)]" onClick={() => setDismissed((s) => new Set(s).add(insight.id))}>
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
  { value: "basic", label: "Basic", desc: "Shared advisors see name and contact only." },
  { value: "full", label: "Full", desc: "Shared advisors see all details (subject to access level)." },
];

const MOCK_ADVISORS = [
  { id: "2", name: "Marie Limousis" },
  { id: "3", name: "Pierre Duval" },
  { id: "4", name: "Claire Martin" },
];

function SharingTabContent({ vic }: { vic: VIC }) {
  const [level, setLevel] = useState<VIC["sharing_level"]>(vic.sharing_level ?? "none");
  const [publishToAgency, setPublishToAgency] = useState(!!vic.is_shared_to_agency);
  const [sharedWith, setSharedWith] = useState<SharedAccess[]>(vic.shared_with ?? []);
  const [addAdvisorOpen, setAddAdvisorOpen] = useState(false);
  const [newAdvisorId, setNewAdvisorId] = useState("");
  const [newAccessLevel, setNewAccessLevel] = useState<"view" | "edit">("view");

  useEffect(() => {
    setLevel(vic.sharing_level ?? "none");
    setPublishToAgency(!!vic.is_shared_to_agency);
    setSharedWith(vic.shared_with ?? []);
  }, [vic.id, vic.sharing_level, vic.is_shared_to_agency, vic.shared_with]);

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

  return (
    <div className="space-y-4">
      <Section title="Sharing level">
        <p className="text-xs text-[rgba(245,245,245,0.5)] mb-3">Choose how much shared advisors can see.</p>
        <div className="flex flex-wrap gap-2">
          {SHARING_LEVELS.map((opt) => (
            <button
              key={opt.value ?? "none"}
              type="button"
              onClick={() => setLevel(opt.value ?? "none")}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                level === opt.value
                  ? "border-[#F5F5F5] bg-white/10 text-[#F5F5F5]"
                  : "border-white/10 bg-white/5 text-[rgba(245,245,245,0.8)] hover:border-white/20"
              )}
            >
              <span className="font-medium block">{opt.label}</span>
              <span className="text-xs text-[rgba(245,245,245,0.5)]">{opt.desc}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Share with advisors">
        <div className="space-y-2">
          {sharedWith.length === 0 ? (
            <p className="text-sm text-[rgba(245,245,245,0.5)]">No advisors shared yet.</p>
          ) : (
            sharedWith.map((s) => (
              <div key={s.advisor_id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                <span className="flex-1 text-sm text-[#F5F5F5]">{s.advisor_name ?? s.advisor_id}</span>
                <Select value={s.access_level} onValueChange={(v) => setAdvisorAccess(s.advisor_id, v as "view" | "edit")}>
                  <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-[#F5F5F5] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-[rgba(245,245,245,0.5)]">{s.shared_at ? formatDate(s.shared_at) : ""}</span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[rgba(245,245,245,0.5)] hover:text-[var(--muted-error-text)]" onClick={() => removeAdvisor(s.advisor_id)}>
                  <X size={14} />
                </Button>
              </div>
            ))
          )}
          {!addAdvisorOpen ? (
            <Button type="button" variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]" onClick={() => setAddAdvisorOpen(true)}>
              Add Advisor
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-3">
              <Select value={newAdvisorId || undefined} onValueChange={setNewAdvisorId}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-[#F5F5F5]">
                  <SelectValue placeholder="Select advisor" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ADVISORS.filter((a) => !sharedWith.some((s) => String(s.advisor_id) === a.id)).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newAccessLevel} onValueChange={(v) => setNewAccessLevel(v as "view" | "edit")}>
                <SelectTrigger className="w-24 bg-white/5 border-white/10 text-[#F5F5F5]">
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
      <Section title="Agency visibility">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[#F5F5F5]">Publish to Agency Directory</Label>
            <p className="text-xs text-[rgba(245,245,245,0.5)] mt-0.5">Other agency advisors can discover this VIC (read-only).</p>
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
    </div>
  );
}

type Props = {
  vic: VIC;
  activeTab: DetailTabId;
  canViewSensitive: boolean;
  onUpdate: () => void;
  travelProfiles?: VIC["travel_profiles"];
  onAddTravelProfile?: () => void;
};

export default function DetailTabContent({ vic, activeTab, canViewSensitive, onUpdate, travelProfiles: travelProfilesProp, onAddTravelProfile }: Props) {
  const showToast = useToast();
  const [sendFormOpen, setSendFormOpen] = useState(false);
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
    const enrichedCount = Object.keys(provenance).filter((k) => provenance[k]?.source === "acuity").length;
    const totalFields = 24;
    const completeness = Math.round((enrichedCount / totalFields) * 100);
    const acuityDaysAgo = acuityLastRun ? Math.floor((Date.now() - new Date(acuityLastRun).getTime()) / (24 * 60 * 60 * 1000)) : null;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--muted-accent-border)] bg-[var(--muted-accent-bg)] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-accent-text)] mb-3">Acuity Intelligence Summary</h3>
          {acuityLastRun ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[rgba(245,245,245,0.8)]">Last run: {formatDate(acuityLastRun) ?? acuityLastRun}</span>
                <span className="text-[rgba(245,245,245,0.8)]">Provider: {acuityProvider}</span>
                <span className="text-[rgba(245,245,245,0.8)]">Confidence: {String(acuityConfidence).charAt(0).toUpperCase() + String(acuityConfidence).slice(1)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full border border-gray-600 bg-white/10 overflow-hidden max-w-[120px]">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: completeness + "%" }} />
                </div>
                <span className="text-xs text-white">{enrichedCount} of {totalFields} profile fields enriched</span>
              </div>
              {acuityDaysAgo != null && acuityDaysAgo > 30 && (
                <Button variant="outline" size="sm" className="border-[var(--muted-accent-border)] text-[var(--muted-accent-text)]" onClick={onUpdate}>Refresh</Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[rgba(245,245,245,0.7)] mb-2">Acuity has not been run yet. Run Acuity from the header to enrich this profile.</p>
          )}
        </div>
        <Section title="At a Glance">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row label="Preferred name" value={vic.preferred_name} acuityProvenance={provenance.preferred_name} />
            <Row label="Primary contact" value={contact || undefined} />
            <Row label="Location" value={location || undefined} acuityProvenance={provenance.home_city || provenance.home_country} />
            <Row label="Company & Role" value={[vic.company ?? leg.company, vic.title ?? leg.role].filter(Boolean).join(" · ") || undefined} />
            <Row label="Client since" value={vic.client_since ? formatDate(vic.client_since) ?? vic.client_since : undefined} />
            <Row label="Relationship status" value={vic.relationship_status?.replace(/_/g, " ") ?? undefined} />
            <Row label="Last Acuity run" value={acuityLastRun ? (formatDate(acuityLastRun) ?? acuityLastRun) : undefined} />
          </div>
        </Section>
        {tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="text-xs lowercase border border-gray-600 text-gray-400 rounded-full px-2 py-0.5">
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
      </div>
    );
  }

  if (activeTab === "identity") {
    const prov = vic.field_provenance ?? {};
    const dobValue: React.ReactNode = !vic.date_of_birth
      ? undefined
      : canViewSensitive
        ? (formatDate(vic.date_of_birth) ?? vic.date_of_birth)
        : <span className="inline-flex items-center gap-1.5"><Lock size={12} className="text-[rgba(245,245,245,0.5)]" />••/••/••••</span>;
    const addressValue: React.ReactNode = !vic.home_address
      ? undefined
      : canViewSensitive
        ? vic.home_address
        : <span className="inline-flex items-center gap-1.5"><Lock size={12} className="text-[rgba(245,245,245,0.5)]" />••••••••••••</span>;
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
            <Row label="Company" value={vic.company ?? leg.company} emptyLabel="Not set" acuityProvenance={prov.company} />
            <Row label="Title" value={vic.title} emptyLabel="Not set" acuityProvenance={prov.title} />
            <Row label="Preferred name" value={vic.preferred_name} emptyLabel="Not set" acuityProvenance={prov.preferred_name} />
            <Row label="Nationality" value={vic.nationality} emptyLabel="Not set" acuityProvenance={prov.nationality} />
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
          vic.relationship_status === "inactive" && "bg-[rgba(245,245,245,0.15)] text-[rgba(245,245,245,0.7)]",
          vic.relationship_status === "prospect" && "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]",
          vic.relationship_status === "past" && "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border border-[var(--muted-amber-border)]",
          vic.relationship_status === "do_not_contact" && "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border border-[var(--muted-error-border)]",
        ].filter(Boolean).join(" ") || "bg-white/10 text-[rgba(245,245,245,0.8)]"}
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
            <Row label="Client since" value={vic.client_since ? formatDate(vic.client_since) ?? vic.client_since : undefined} emptyLabel="Not set" />
            <Row label="Referral source" value={vic.referral_source} emptyLabel="Not set" acuityProvenance={vic.field_provenance?.referral_source} />
            <Row label="Referred by VIC" value={referredByLink} emptyLabel="Not set" />
            <div className="flex gap-2 py-1.5 border-b border-[rgba(255,255,255,0.06)] items-center">
              <span className="text-[rgba(245,245,245,0.5)] shrink-0 w-36">Relationship status</span>
              {statusBadge ?? <span className="text-gray-600 italic">Not set</span>}
            </div>
            <div className="py-1.5 border-b border-[rgba(255,255,255,0.06)] last:border-0">
              <span className="text-[rgba(245,245,245,0.5)] block w-36 mb-1">VIP notes</span>
              <p className="whitespace-pre-wrap text-[#F5F5F5]">{vic.vip_notes || <span className="text-gray-600 italic">Not set</span>}</p>
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
    return (
      <div className="space-y-4">
        <Section title="Preferences & tags">
          <div className="space-y-0">
            {(vic.tags ?? leg.customTags ?? []).length > 0 && (
              <div className="py-1.5 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[rgba(245,245,245,0.5)] block w-36 mb-1">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {(vic.tags ?? leg.customTags ?? []).map((t: string) => (
                    <span key={t} className="text-xs lowercase border border-gray-600 text-gray-400 rounded-full px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            )}
            <Row label="Dietary restrictions" value={vic.dietary_restrictions} acuityProvenance={vic.field_provenance?.dietary_restrictions} />
            <Row label="Accessibility needs" value={vic.accessibility_needs} acuityProvenance={vic.field_provenance?.accessibility_needs} />
            <Row label="GDPR consent" value={vic.gdpr_consent_given == null ? undefined : vic.gdpr_consent_given ? "Yes" : "No"} />
            <Row label="Marketing consent" value={vic.marketing_consent == null ? undefined : vic.marketing_consent ? "Yes" : "No"} />
          </div>
        </Section>
        {notes && (
          <Section title="Notes">
            <p className="whitespace-pre-wrap">{notes}</p>
          </Section>
        )}
        {leg.familyContext && (
          <Section title="Family context">
            <p className="whitespace-pre-wrap">{leg.familyContext}</p>
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
              </div>
              {vic.loyalty_programs && vic.loyalty_programs.length > 0 && (
                <div className="py-1.5">
                  <span className="text-[rgba(245,245,245,0.5)] block w-36 mb-1">Loyalty programs</span>
                  <ul className="space-y-2">
                    {vic.loyalty_programs.map((lp) => (
                      <li key={lp.id} className="flex items-center justify-between rounded bg-white/5 px-2 py-1.5 text-sm">
                        <span className="text-[#F5F5F5]">{lp.program_name}</span>
                        <span className="text-[rgba(245,245,245,0.6)]">{lp.membership_id ?? "***----"}</span>
                        {lp.tier && <span className="text-xs text-[rgba(245,245,245,0.5)]">{lp.tier}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]">
                  Add Document
                </Button>
                <Button type="button" variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]">
                  Add Loyalty Program
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-[rgba(245,245,245,0.5)]">Document details are restricted. You need full access to view.</p>
          )}
        </Section>

        <Section title="Client forms">
          {vicId === "fake-vic-1" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-white/[0.08] p-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-[#F5F5F5]">📋 Travel Preferences Form</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400">Completed</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Submitted 12 Mar 2026</p>
                <Button type="button" variant="outline" size="sm" className="mt-2 border-white/10 text-xs h-8">
                  View Responses
                </Button>
              </div>
              <div className="rounded-lg border border-white/[0.08] p-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-[#F5F5F5]">📋 Passport & Documents</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400">Pending</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Sent 10 Mar 2026 · Not yet submitted</p>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="outline" size="sm" className="border-white/10 text-xs h-8">
                    Resend
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="border-white/10 text-xs h-8">
                    View Form
                  </Button>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="border-white/10" onClick={() => setSendFormOpen(true)}>
                + Send New Form
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">No forms sent yet</p>
              <Button type="button" variant="outline" size="sm" className="border-white/10" onClick={() => setSendFormOpen(true)}>
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

  if (activeTab === "travel") {
    const profiles = travelProfilesProp ?? vic.travel_profiles ?? [];
    const discovered = vic.travel_discovered_preferences ?? [];
    return (
      <div className="space-y-4">
        <Section title="Travel profiles">
          {profiles.length === 0 ? (
            <p className="text-[rgba(245,245,245,0.6)]">No travel profiles yet.</p>
          ) : (
            <ul className="space-y-2">
              {profiles.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.06)] last:border-0">
                  <div>
                    <span className="font-medium capitalize">{p.profile_type.replace(/_/g, " ")}</span>
                    {p.is_primary && <span className="ml-2 text-xs text-[rgba(245,245,245,0.5)]">Primary</span>}
                    {p.preferences_summary && <p className="text-xs text-[rgba(245,245,245,0.6)] mt-0.5">{p.preferences_summary}</p>}
                  </div>
                  <Link
                    href={`/dashboard/vics/${vicId}/travel/${p.profile_type}`}
                    className="text-sm text-[rgba(245,245,245,0.8)] hover:underline"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {onAddTravelProfile && (
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onAddTravelProfile}>
              Add Travel Profile
            </Button>
          )}
        </Section>
        {discovered.length > 0 && (
          <TravelDiscoveredPreferences discovered={discovered} />
        )}
      </div>
    );
  }

  if (activeTab === "linked_entities") {
    const legVic = vic as { assigned_product_ids?: string[]; itinerary_ids?: string[] };
    const productIds = vic.linked_product_ids ?? legVic.assigned_product_ids ?? [];
    const resolvedProducts: Product[] = productIds.length
      ? productIds
          .map((id) => FAKE_PRODUCTS.find((p) => p.id === id))
          .filter((p): p is Product => p != null)
      : [];
    const vicId = getVICId(vic);
    const linkedItineraries = FAKE_ITINERARIES.filter((it: Itinerary) => it.primary_vic_id === vicId);
    return (
      <div className="space-y-4">
        <Section title="Linked Products">
          {resolvedProducts.length === 0 ? (
            <>
              <p className="text-[rgba(245,245,245,0.6)] text-sm">No products linked yet. Link products to track this VIC&apos;s preferred properties.</p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => {}}>Link Product</Button>
            </>
          ) : (
            <div className="space-y-2">
              {resolvedProducts.map((p) => {
                const Icon = CATEGORY_ICONS[p.category] ?? CATEGORY_ICONS.accommodation;
                const location = [p.city, p.country].filter(Boolean).join(", ") || "—";
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/products/${p.id}`}
                    className="flex items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3 text-sm hover:bg-white/[0.04]"
                  >
                    <Icon size={18} className="text-[rgba(245,245,245,0.6)] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#F5F5F5]">{p.name}</p>
                      <p className="text-[rgba(245,245,245,0.6)] text-xs">{location}</p>
                    </div>
                  </Link>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={() => {}}>Link Product</Button>
            </div>
          )}
        </Section>
        <Section title="Linked Itineraries">
          {linkedItineraries.length === 0 ? (
            <>
              <p className="text-[rgba(245,245,245,0.6)] text-sm">No itineraries linked yet.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/itineraries?create=1&vic_id=${vicId}`}>Create New Itinerary</Link>
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/itineraries">Link Itinerary</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {linkedItineraries.map((it) => {
                const eventCount = it.days?.reduce((acc, d) => acc + (d.events?.length ?? 0), 0) ?? 0;
                const dateRange = it.trip_start_date && it.trip_end_date ? `${it.trip_start_date} – ${it.trip_end_date}` : it.trip_start_date ?? "—";
                return (
                  <Link key={it.id} href={`/dashboard/itineraries/${it.id}`} className="block rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3 text-sm hover:bg-white/[0.04]">
                    <p className="font-medium text-[#F5F5F5]">{it.trip_name ?? it.id}</p>
                    <p className="text-[rgba(245,245,245,0.6)] text-xs mt-0.5">{dateRange}</p>
                    <p className="text-[rgba(245,245,245,0.5)] text-xs">{(it.destinations ?? []).join(", ") || "—"} · {eventCount} events</p>
                    {it.status && <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.7)]">{it.status}</span>}
                  </Link>
                );
              })}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/itineraries?create=1&vic_id=${vicId}`}>Create New Itinerary</Link>
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/itineraries">Link Itinerary</Link>
                </Button>
              </div>
            </div>
          )}
        </Section>
      </div>
    );
  }

  if (activeTab === "sharing") {
    return <SharingTabContent vic={vic} />;
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
            <p className="text-[rgba(245,245,245,0.5)] text-sm">No edit history available.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {editHistory.slice(0, 10).map((e, i) => (
                <li key={i} className="border-b border-[rgba(255,255,255,0.06)] pb-2 last:border-0">
                  <span className="text-[#F5F5F5]">{e.change ?? "Updated"}</span>
                  <span className="text-[rgba(245,245,245,0.5)] ml-2">— {e.by} · {e.at ? formatDate(e.at) ?? e.at : ""}</span>
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
