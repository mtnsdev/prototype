import type {
  ActivityEvent,
  AdvisoryNote,
  CategoryFinancial,
  FinancialSummary,
  GiftLog,
  PreferenceDomain,
  PreferenceSignal,
  Proposal,
  Relationship,
  SignalSource,
  SourceConflict,
  TouchPoint,
  Trip,
  VICPersonaBundle,
  VICProfile,
} from "@/types/vic-profile";

/** Ledger-shaped seed (see `src/data/vic-mock-data.json`). */
export interface VicMockNormalizedRoot {
  profiles: Array<{
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    location: string;
    occupation?: string;
    clientSince: string;
    referredBy?: VICProfile["referredBy"];
    ltvTier: VICProfile["ltvTier"];
    primaryAdvisorId: string;
    primaryAdvisorName: string;
    keyDates: VICProfile["keyDates"];
    tags: string[];
  }>;
  preferences: Record<string, RawPreference[]>;
  trips: Trip[];
  proposals: Proposal[];
  relationships: Relationship[];
  financials: Record<string, RawFinancial>;
  advisories: AdvisoryNote[];
  sourceConflicts: SourceConflict[];
  touchPoints: Array<Omit<TouchPoint, "date"> & { date: string }>;
  activityEvents: Array<{
    id: string;
    type: ActivityEvent["type"];
    title: string;
    timestamp: string;
    sourceIcon?: ActivityEvent["sourceIcon"];
    linkedEntityId?: string;
    linkedEntityType?: ActivityEvent["linkedEntityType"];
  }>;
}

interface RawPreference {
  id: string;
  domainId: string;
  value: string;
  confidence: "high" | "medium" | "low";
  sources: Array<{
    type: string;
    label: string;
    date?: string;
  }>;
  firstObserved: string;
  lastConfirmed: string;
  lastConfirmedContext?: string;
  conflicts?: Array<{
    conflictingValue: string;
    source: { type: string; label: string; date?: string };
    context?: string;
    resolved?: boolean;
  }>;
  pinned: boolean;
}

export interface RawFinancial {
  vicId: string;
  lifetimeValue: number;
  lifetimeCommission: number;
  effectiveCommissionRate: number;
  averageTripValue: number;
  totalTrips: number;
  projectedPipelineValue: number;
  projectedPipelineCommission: number;
  dataSource: FinancialSummary["dataSource"];
  yearlyBreakdown: FinancialSummary["yearlyBreakdown"];
  partnerBreakdown: FinancialSummary["partnerBreakdown"];
  categoryBreakdown: Array<{
    category: string;
    totalValue: number;
    percentage: number;
  }>;
}

const DOMAIN_ORDER = [
  "accommodation",
  "dining",
  "experiences",
  "logistics",
  "budget",
  "communication",
  "sensitivities",
] as const satisfies readonly PreferenceDomain["name"][];

const DOMAIN_META: Record<string, { displayName: string; icon: string }> = {
  accommodation: { displayName: "Accommodation", icon: "bed" },
  dining: { displayName: "Dining", icon: "utensils" },
  experiences: { displayName: "Experiences", icon: "compass" },
  logistics: { displayName: "Logistics", icon: "train" },
  budget: { displayName: "Budget", icon: "wallet" },
  communication: { displayName: "Communication", icon: "message" },
  sensitivities: { displayName: "Sensitivities", icon: "shield" },
};

/** Legacy list-route IDs from `fakeData` → advisor profile id */
const PROFILE_TO_LEGACY_VIC: Partial<Record<string, string>> = {
  vic_harrington_richard: "vic-001",
  vic_sofia_reyes: "vic-002",
};

const ACTIVITY_ID_PREFIX: Record<string, string> = {
  rh: "vic_harrington_richard",
  sr: "vic_sofia_reyes",
  na: "vic_nadia_alrashid",
  jcp: "vic_james_chenpark",
  ap: "vic_anya_petrova",
};

function inferActivityVicId(eventId: string): string | undefined {
  const m = /^ae_([a-z]+)_/i.exec(eventId);
  if (!m) return undefined;
  return ACTIVITY_ID_PREFIX[m[1].toLowerCase()];
}

function isoDateOrDateTime(d: string): string {
  return d.includes("T") ? d : `${d}T12:00:00.000Z`;
}

function normalizeProfile(p: VicMockNormalizedRoot["profiles"][number]): VICProfile {
  const { photoUrl, ...rest } = p;
  return {
    ...rest,
    ...(photoUrl != null ? { photoUrl: photoUrl || undefined } : {}),
  };
}

function buildDomains(prefs: RawPreference[] | undefined): PreferenceDomain[] {
  if (!prefs?.length) return [];
  const byDomain = new Map<string, RawPreference[]>();
  for (const pref of prefs) {
    const list = byDomain.get(pref.domainId) ?? [];
    list.push(pref);
    byDomain.set(pref.domainId, list);
  }
  const out: PreferenceDomain[] = [];
  for (const key of DOMAIN_ORDER) {
    const list = byDomain.get(key);
    if (!list?.length) continue;
    const meta = DOMAIN_META[key];
    if (!meta) continue;
    const domainId = `dom-${key}`;
    out.push({
      id: domainId,
      name: key,
      displayName: meta.displayName,
      icon: meta.icon,
      signals: list.map(
        (pref): PreferenceSignal => ({
          id: pref.id,
          domainId,
          value: pref.value,
          confidence: pref.confidence,
          sources: pref.sources.map((s) => ({
            type: s.type as SignalSource["type"],
            label: s.label,
            date: s.date,
          })),
          firstObserved: pref.firstObserved,
          lastConfirmed: pref.lastConfirmed,
          lastConfirmedContext: pref.lastConfirmedContext,
          conflicts: (pref.conflicts ?? []).map((c) => ({
            conflictingValue: c.conflictingValue,
            source: {
              type: c.source.type as SignalSource["type"],
              label: c.source.label,
              date: c.source.date,
            },
            context: c.context,
            resolved: c.resolved ?? false,
          })),
          pinned: pref.pinned,
        })
      ),
    });
  }
  return out;
}

function defaultFinancials(vicId: string): FinancialSummary {
  return {
    vicId,
    lifetimeValue: 0,
    lifetimeCommission: 0,
    effectiveCommissionRate: 0,
    averageTripValue: 0,
    totalTrips: 0,
    projectedPipelineValue: 0,
    projectedPipelineCommission: 0,
    yearlyBreakdown: [],
    partnerBreakdown: [],
    categoryBreakdown: [],
    dataSource: "unavailable",
  };
}

function normalizeFinancials(raw: RawFinancial | undefined, vicId: string): FinancialSummary {
  if (!raw) return defaultFinancials(vicId);
  const yearlyBreakdown = (raw.yearlyBreakdown ?? []).map((y) => ({
    ...y,
    yoyChange:
      y.yoyChange != null && Math.abs(y.yoyChange) <= 1 ? y.yoyChange * 100 : y.yoyChange,
  }));
  const categoryBreakdown: CategoryFinancial[] = (raw.categoryBreakdown ?? []).map((c) => ({
    category: c.category as CategoryFinancial["category"],
    totalValue: c.totalValue,
    percentage: c.percentage <= 1 ? Math.round(c.percentage * 1000) / 10 : c.percentage,
  }));
  return {
    vicId: raw.vicId ?? vicId,
    lifetimeValue: raw.lifetimeValue,
    lifetimeCommission: raw.lifetimeCommission,
    effectiveCommissionRate: raw.effectiveCommissionRate,
    averageTripValue: raw.averageTripValue,
    totalTrips: raw.totalTrips,
    projectedPipelineValue: raw.projectedPipelineValue,
    projectedPipelineCommission: raw.projectedPipelineCommission,
    yearlyBreakdown,
    partnerBreakdown: raw.partnerBreakdown ?? [],
    categoryBreakdown,
    dataSource: raw.dataSource,
  };
}

function giftLogsFromTouchPoints(tps: TouchPoint[]): GiftLog[] {
  return tps
    .filter((t) => t.type === "gift_sent")
    .map((t) => ({
      id: t.id,
      vicId: t.vicId,
      description: t.details ? `${t.title} — ${t.details}` : t.title,
      date: t.date.slice(0, 10),
    }));
}

export function buildPersonaBundlesFromNormalized(root: VicMockNormalizedRoot): VICPersonaBundle[] {
  const touchByVic = new Map<string, TouchPoint[]>();
  for (const t of root.touchPoints) {
    const tp: TouchPoint = {
      ...t,
      date: isoDateOrDateTime(t.date),
    };
    const list = touchByVic.get(t.vicId) ?? [];
    list.push(tp);
    touchByVic.set(t.vicId, list);
  }

  const activityByVic = new Map<string, ActivityEvent[]>();
  for (const ev of root.activityEvents) {
    const vid = inferActivityVicId(ev.id);
    if (!vid) continue;
    const ae: ActivityEvent = {
      id: ev.id,
      type: ev.type,
      title: ev.title,
      timestamp: isoDateOrDateTime(ev.timestamp),
      sourceIcon: ev.sourceIcon,
      linkedEntityId: ev.linkedEntityId,
      linkedEntityType: ev.linkedEntityType,
    };
    const list = activityByVic.get(vid) ?? [];
    list.push(ae);
    activityByVic.set(vid, list);
  }

  return root.profiles.map((prof) => {
    const id = prof.id;
    const touchPoints = touchByVic.get(id) ?? [];
    const linkedLegacy = PROFILE_TO_LEGACY_VIC[id];

    return {
      personaKey: id,
      linkedVicIds: linkedLegacy ? [linkedLegacy] : undefined,
      profile: normalizeProfile(prof),
      domains: buildDomains(root.preferences[id]),
      trips: root.trips.filter((tr) => tr.vicId === id),
      proposals: root.proposals
        .filter((pr) => pr.vicId === id)
        .map((p) => ({
          ...p,
          linkedTripId: p.linkedTripId === null ? undefined : p.linkedTripId,
        })),
      actionItems: [],
      relationships: root.relationships.filter((r) => r.vicId === id),
      financials: normalizeFinancials(root.financials[id], id),
      touchPoints,
      specialRequests: [],
      giftLogs: giftLogsFromTouchPoints(touchPoints),
      advisories: root.advisories.filter((a) => a.vicId === id),
      sourceConflicts: root.sourceConflicts.filter((c) => c.vicId === id),
      advisorNotes: [],
      internalFlags: [],
      activity: activityByVic.get(id) ?? [],
    };
  });
}
