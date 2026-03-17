/**
 * Dev-only fake VIC data so you can play with list, search, filters, and detail view.
 * Used when API fails or returns empty in development.
 */

import type { VIC } from "@/types/vic";

const now = new Date();
const iso = (d: Date) => d.toISOString();

// Birthday within 14 days for lifecycle indicator (Camille)
const birthdaySoon = (() => { const b = new Date(now); b.setDate(b.getDate() + 7); const y = b.getFullYear() - 35; const m = String(b.getMonth() + 1).padStart(2, "0"); const day = String(b.getDate()).padStart(2, "0"); return `${y}-${m}-${day}`; })();
// Passport expiry <180 days for warning (Dominique)
const passportExpirySoon = iso(new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000));

export const FAKE_VICS: VIC[] = [
  // —— Owned by OTHER (Marie "2") — Shared with Me (full) ——
  {
    id: "fake-vic-1",
    _id: "fake-vic-1",
    full_name: "Jean-Christophe Chopin",
    preferred_name: "JC",
    title: "Mr",
    email: "jc@example.com",
    email_secondary: "jc.work@xyz.com",
    phone_primary: "+33 6 12 34 56 78",
    phone_secondary: "+33 1 23 45 67 89",
    nationality: "FR",
    date_of_birth: "1970-05-15",
    home_address: "12 Avenue des Champs-Élysées",
    home_city: "Paris",
    home_country: "France",
    time_zone: "Europe/Paris",
    language_primary: "French",
    languages_spoken: ["French", "English"],
    city: "Paris",
    country: "France",
    company: "XYZ Capital",
    role: "Founder",
    tags: ["vip", "wine", "gastronomy"],
    customTags: ["vip", "wine", "gastronomy"],
    assigned_advisor_id: "2",
    assigned_advisor_name: "Marie Limousis",
    client_since: "2020-03-01",
    referral_source: "Event",
    relationship_status: "active",
    vip_notes: "Known entrepreneur. Met at Monaco event 2024.",
    acuity_status: "complete",
    acuityStatus: "complete",
    acuity_last_run: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    acuityLastRun: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    acuity_provider: "Gemini",
    acuity_confidence: "high",
    field_provenance: {
      nationality: { source: "acuity", provider: "Gemini", confidence: "high", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), verified: false },
      date_of_birth: { source: "acuity", provider: "Gemini", confidence: "high", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), verified: true },
      home_city: { source: "acuity", provider: "Gemini", confidence: "high", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), verified: false },
      home_country: { source: "acuity", provider: "Gemini", confidence: "high", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), verified: false },
      time_zone: { source: "acuity", provider: "Gemini", confidence: "high", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), verified: false },
      language_primary: { source: "acuity", provider: "Gemini", confidence: "high", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), verified: false },
      languages_spoken: { source: "acuity", provider: "Gemini", confidence: "high", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), verified: false },
      preferred_name: { source: "manual" },
    },
    relationship_insights: [
      { id: "ri1", text: "Board member at Kering Group (source: LinkedIn via Gemini)", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri2", text: "Mentioned in Virtuoso Life Magazine, March 2025", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri3", text: "Connected to Sophie Laurent via Rothschild & Co network", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri4", text: "XYZ Capital founder; luxury and gastronomy focus", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
    ],
    travel_discovered_preferences: [
      { id: "td1", text: "Prefers overwater villas", profile_type: "leisure", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td2", text: "Frequent Aman guest", profile_type: "leisure", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td3", text: "Wine enthusiast — Barolo region", profile_type: "leisure", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td4", text: "City hotels, direct flights", profile_type: "business", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td5", text: "Helicopter transfers for short hops", profile_type: "business", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td6", text: "Alain Ducasse dining preference", profile_type: "leisure", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
    ],
    created_by: "2",
    createdBy: "2",
    created_by_name: "Marie Limousis",
    createdByName: "Marie Limousis",
    updated_by: "2",
    updated_by_name: "Marie Limousis",
    created_at: iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
    updated_at: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
    phone: "+33 6 12 34 56 78",
    notes: "Known entrepreneur with interests in wine and gastronomy.",
    familyContext: "Married, children are adults (~30s).",
    preferences: "Fine wine, contemporary art, Mediterranean cuisine",
    shared_with: [{ advisor_id: "1", advisor_name: "Marie Limousis", access_level: "edit", shared_at: iso(now) }],
    sharing_level: "full",
    loyalty_programs: [
      { id: "lp1", program_name: "Four Seasons Preferred Partner", membership_id: "***1234", tier: "Gold", added_at: iso(now) },
      { id: "lp2", program_name: "Virtuoso", membership_id: "***5678", tier: "Member", added_at: iso(now) },
    ],
    loyaltyPrograms: "Four Seasons Preferred Partner, Virtuoso",
    travel_profiles: [
      { id: "tp1", profile_type: "business", is_primary: true, preferences_summary: "City hotels, direct flights", pace: "fast", created_at: iso(now), updated_at: iso(now) },
      { id: "tp2", profile_type: "leisure", is_primary: false, preferences_summary: "Wine regions, gastronomy", pace: "moderate", created_at: iso(now), updated_at: iso(now) },
    ],
    acuityProfile: "## SNAPSHOT\nJean-Christophe Chopin · Founder, XYZ Capital · Paris, France\nWealth tier: HIGH · Data availability: Rich\n\n## ACTIONABLE INSIGHTS\nGastronomy & Wine Enthusiast | Confidence: HIGH",
    edit_history: [
      { by: "Marie Limousis", at: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)), change: "Updated contact details" },
      { by: "Marie Limousis", at: iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), change: "Created VIC" },
    ],
  } as VIC,
  // —— Owned by current user "1" (5 total: Dom, Camille, Eric, Isabelle, Gad) ——
  {
    id: "fake-vic-2",
    _id: "fake-vic-2",
    full_name: "Dominique Sarraute",
    preferred_name: "Dom",
    title: "Ms",
    email: "dom@abc-consulting.fr",
    phone_primary: "+33 4 78 12 34 56",
    nationality: "FR",
    date_of_birth: "1985-08-20",
    home_city: "Lyon",
    home_country: "France",
    time_zone: "Europe/Paris",
    language_primary: "French",
    languages_spoken: ["French", "English"],
    city: "Lyon",
    country: "France",
    company: "ABC Consulting",
    role: "Director",
    tags: ["new", "corporate"],
    customTags: ["new", "corporate"],
    assigned_advisor_id: "1",
    assigned_advisor_name: "Marie Limousis",
    client_since: "2023-06-01",
    referral_source: "Referral",
    relationship_status: "prospect",
    acuity_status: "not_run",
    acuityStatus: "not_run",
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marie Limousis",
    createdByName: "Marie Limousis",
    updated_by: "1",
    updated_by_name: "Marie Limousis",
    created_at: iso(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)),
    updated_at: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
    passport_number: "****1234",
    passport_country: "FR",
    passport_expiry: passportExpirySoon,
    linked_product_ids: ["prod-1", "prod-2"],
    notes: "Referred by Jean-Christophe. Interested in incentive travel.",
  } as VIC,
  {
    id: "fake-vic-3",
    _id: "fake-vic-3",
    full_name: "Camille Signoles",
    email: "camille@def-agency.fr",
    phone_primary: "+33 1 45 67 89 01",
    home_city: "Paris",
    home_country: "France",
    city: "Paris",
    country: "France",
    company: "DEF Agency",
    role: "Manager",
    tags: [],
    customTags: [],
    assigned_advisor_id: "1",
    assigned_advisor_name: "Marie Limousis",
    client_since: "2024-01-15",
    relationship_status: "inactive",
    acuity_status: "not_run",
    acuityStatus: "not_run",
    date_of_birth: birthdaySoon,
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marie Limousis",
    createdByName: "Marie Limousis",
    updated_by: "1",
    updated_by_name: "Marie Limousis",
    created_at: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
  } as VIC,
  {
    id: "fake-vic-4",
    _id: "fake-vic-4",
    full_name: "Eric Tournier",
    city: "Geneva",
    country: "Switzerland",
    company: "Private Bank SA",
    role: "Wealth Advisor",
    customTags: ["vip", "luxury"],
    tags: ["vip", "luxury"],
    acuity_status: "complete",
    acuityStatus: "complete",
    acuity_last_run: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)),
    acuityLastRun: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)),
    acuity_provider: "Perplexity",
    acuity_confidence: "medium",
    field_provenance: {
      home_city: { source: "acuity", provider: "Perplexity", confidence: "medium", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)), verified: false },
      home_country: { source: "acuity", provider: "Perplexity", confidence: "medium", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)), verified: false },
      company: { source: "acuity", provider: "Perplexity", confidence: "medium", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)), verified: false },
      role: { source: "acuity", provider: "Perplexity", confidence: "medium", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)), verified: false },
      time_zone: { source: "acuity", provider: "Perplexity", confidence: "medium", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)), verified: false },
      language_primary: { source: "acuity", provider: "Perplexity", confidence: "medium", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)), verified: false },
    },
    relationship_insights: [
      { id: "er1", text: "Wealth advisor at Private Bank SA; UHNW focus", provider: "Perplexity", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)) },
      { id: "er2", text: "LinkedIn: 500+ connections in finance and luxury", provider: "Perplexity", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)) },
    ],
    travel_discovered_preferences: [
      { id: "et1", text: "Discreet, high-touch service", profile_type: "business", provider: "Perplexity", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)) },
      { id: "et2", text: "Family office coordination", profile_type: "business", provider: "Perplexity", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)) },
      { id: "et3", text: "Swiss Alps ski preferences", profile_type: "leisure", provider: "Perplexity", sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)) },
    ],
    assigned_advisor_id: "1",
    assigned_advisor_name: "Marie Limousis",
    client_since: "2022-06-15",
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marie Limousis",
    createdByName: "Marie Limousis",
    updated_by: "1",
    updated_by_name: "Marie Limousis",
    created_at: iso(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)),
    updated_at: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
    email: "e.tournier@example.ch",
    passport_number: "****5678",
    passport_country: "CH",
    passport_expiry: iso(new Date(now.getTime() + 400 * 24 * 60 * 60 * 1000)),
    notes: "UHNW client. Prefers discreet, high-touch service.",
    acuityProfile: "## SNAPSHOT\nEric Tournier · Wealth Advisor · Geneva, Switzerland\nWealth tier: UHNW · Focus: Discretion, family office coordination.",
    relationship_status: "active",
  } as VIC,
  {
    id: "fake-vic-5",
    _id: "fake-vic-5",
    full_name: "Isabelle Forget",
    city: "Monaco",
    country: "Monaco",
    company: "Fashion House",
    role: "Creative Director",
    customTags: ["vip", "luxury", "gastronomy"],
    tags: ["vip", "luxury", "gastronomy"],
    acuity_status: "running",
    acuityStatus: "running",
    assigned_advisor_id: "1",
    assigned_advisor_name: "Marie Limousis",
    client_since: "2024-02-01",
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marie Limousis",
    createdByName: "Marie Limousis",
    updated_by: "1",
    updated_by_name: "Marie Limousis",
    created_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    notes: "Art and design focus. Attends Art Basel, Venice Biennale.",
    relationship_status: "prospect",
    loyalty_programs: [
      { id: "lp1", program_name: "Marriott Bonvoy", membership_id: "MB-****5678", tier: "Titanium", added_at: iso(now) },
    ],
    loyaltyPrograms: "Marriott Bonvoy",
  } as VIC,
  // —— Agency-published (Jacques owned by other "2") ——
  {
    id: "fake-vic-6",
    _id: "fake-vic-6",
    full_name: "Jacques Veyrat",
    city: "London",
    country: "United Kingdom",
    company: "Veyrat Holdings",
    role: "CEO",
    customTags: ["vip", "corporate"],
    tags: ["vip", "corporate"],
    acuity_status: "failed",
    acuityStatus: "failed",
    created_by: "2",
    createdBy: "2",
    created_by_name: "Pierre Duval",
    createdByName: "Pierre Duval",
    updated_by: "2",
    updated_by_name: "Pierre Duval",
    created_at: iso(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    is_shared_to_agency: true,
    relationship_status: "past",
    notes: "Acuity run failed last time; retry pending.",
  } as VIC,
  // —— Agency-published (Sophie owned by Claire "4") ——
  {
    id: "fake-vic-7",
    _id: "fake-vic-7",
    full_name: "Sophie Laurent",
    city: "New York",
    country: "United States",
    company: "Laurent & Co",
    role: "Partner",
    customTags: ["wine", "new"],
    tags: ["wine", "new"],
    acuity_status: "not_run",
    acuityStatus: "not_run",
    created_by: "4",
    createdBy: "4",
    created_by_name: "Claire Martin",
    createdByName: "Claire Martin",
    updated_by: "4",
    updated_by_name: "Claire Martin",
    created_at: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    is_shared_to_agency: true,
    relationship_status: "active",
    email: "sophie@laurent.co",
    preferences: "Wine tours, Napa, Burgundy.",
  } as VIC,
  {
    id: "fake-vic-8",
    _id: "fake-vic-8",
    full_name: "Gad Elmaleh",
    city: "Paris",
    country: "France",
    company: "—",
    role: "—",
    customTags: ["vip", "luxury", "gastronomy"],
    tags: ["vip", "luxury", "gastronomy"],
    acuity_status: "complete",
    acuityStatus: "complete",
    acuity_last_run: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
    acuityLastRun: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
    assigned_advisor_id: "1",
    assigned_advisor_name: "Marie Limousis",
    client_since: "2021-09-01",
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marie Limousis",
    createdByName: "Marie Limousis",
    updated_by: "1",
    updated_by_name: "Marie Limousis",
    relationship_status: "inactive",
    created_at: iso(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    notes: "High-profile. Privacy-sensitive.",
    acuityProfile: "## SNAPSHOT\nHigh-profile individual · Paris, France\nHandling: Discretion, privacy-first.",
    passport_number: "****9999",
    passport_country: "FR",
    passport_expiry: iso(new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000)),
    loyalty_programs: [
      { id: "lp1", program_name: "Air France-KLM Flying Blue", membership_id: "AF-****1234", tier: "Platinum", added_at: iso(now) },
    ],
    loyaltyPrograms: "Air France-KLM Flying Blue",
  } as VIC,
  // —— Owned by OTHER (Pierre "3") — Shared with Me (basic) ——
  {
    id: "fake-vic-9",
    _id: "fake-vic-9",
    full_name: "Alex Other",
    city: "Berlin",
    country: "Germany",
    company: "Other GmbH",
    role: "Manager",
    customTags: [],
    tags: [],
    acuity_status: "not_run",
    acuityStatus: "not_run",
    created_by: "3",
    createdBy: "3",
    created_by_name: "Pierre Duval",
    createdByName: "Pierre Duval",
    updated_by: "3",
    updated_by_name: "Pierre Duval",
    created_at: iso(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    relationship_status: "do_not_contact",
    shared_with: [{ advisor_id: "1", advisor_name: "Marie Limousis", access_level: "view", shared_at: iso(now) }],
    sharing_level: "basic",
  } as VIC,
];

/** All unique tag values used in fake data (for filter dropdown). */
export const FAKE_VIC_TAG_OPTIONS = ["vip", "wine", "gastronomy", "luxury", "new", "corporate"];

/** All unique countries in fake data. */
export const FAKE_VIC_COUNTRIES = ["France", "Switzerland", "Monaco", "United Kingdom", "United States"];

export interface FilterParams {
  tab?: "mine" | "shared" | "agency";
  userId?: string;
  search?: string;
  tags?: string[];
  country?: string;
  status?: string;
  acuityStatus?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

function isOwner(vic: VIC, userId: string): boolean {
  const oid = vic.created_by ?? (vic as { createdBy?: string }).createdBy;
  return String(oid) === userId || String(vic.assigned_advisor_id) === userId;
}

function isSharedWith(vic: VIC, userId: string): boolean {
  return !!vic.shared_with?.some((s) => String(s.advisor_id) === userId);
}

/** Filter, sort, and paginate a VIC list (for fake data in dev). */
export function filterAndPaginateFakeVics(
  list: VIC[],
  params: FilterParams
): { vics: VIC[]; total: number } {
  let out = [...list];
  const uid = params.userId != null ? String(params.userId) : null;
  if (params.tab && uid) {
    switch (params.tab) {
      case "mine":
        out = out.filter((v) => isOwner(v, uid));
        break;
      case "shared":
        out = out.filter((v) => isSharedWith(v, uid) && !isOwner(v, uid));
        break;
      case "agency":
        out = out.filter((v) => v.is_shared_to_agency === true);
        break;
    }
  }
  const q = (params.search ?? "").trim().toLowerCase();
  if (q) {
    out = out.filter(
      (v) =>
        v.full_name?.toLowerCase().includes(q) ||
        v.company?.toLowerCase().includes(q) ||
        v.role?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.country?.toLowerCase().includes(q) ||
        v.customTags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  if ((params.tags ?? []).length > 0) {
    const tagSet = new Set(params.tags!.map((t) => t.toLowerCase()));
    out = out.filter((v) => (v.tags ?? v.customTags ?? []).some((t) => tagSet.has(String(t).toLowerCase())));
  }
  if (params.country) {
    out = out.filter((v) => (v.home_country ?? v.country) === params.country);
  }
  if (params.status) {
    out = out.filter((v) => v.relationship_status === params.status);
  }
  const acuityVal = params.acuityStatus;
  if (acuityVal) {
    out = out.filter((v) => (v.acuity_status ?? v.acuityStatus) === acuityVal);
  }
  const sortBy = params.sortBy ?? "full_name";
  const order = params.sortOrder ?? "asc";
  out.sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sortBy] ?? "";
    const bVal = (b as unknown as Record<string, unknown>)[sortBy] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: "base" });
    return order === "desc" ? -cmp : cmp;
  });
  const total = out.length;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 20);
  out = out.slice((page - 1) * limit, page * limit);
  return { vics: out, total };
}
