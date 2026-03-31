/**
 * Dev-only fake VIC data so you can play with list, search, filters, and detail view.
 * Used when API fails or returns empty in development.
 */

import type { Team } from "@/types/teams";
import type { VIC } from "@/types/vic";
import { INITIAL_MOCK_TEAMS } from "@/lib/teamsMock";

const now = new Date();
const iso = (d: Date) => d.toISOString();

// Birthday within 14 days for lifecycle indicator (Camille)
const birthdaySoon = (() => { const b = new Date(now); b.setDate(b.getDate() + 7); const y = b.getFullYear() - 35; const m = String(b.getMonth() + 1).padStart(2, "0"); const day = String(b.getDate()).padStart(2, "0"); return `${y}-${m}-${day}`; })();
// Passport expiry <180 days for warning (Dominique)
const passportExpirySoon = iso(new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000));

export const FAKE_VICS: VIC[] = [
  // —— Owned by OTHER (Marco / user-marco) — Shared with Me (full) ——
  {
    id: "vic-001",
    _id: "vic-001",
    full_name: "Jean-Christophe Chopin",
    preferred_name: "JC",
    title: "CEO, Maison Laurent Group",
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
    company: "Maison Laurent Group",
    role: "CEO",
    tags: ["vip", "wine", "gastronomy"],
    customTags: ["vip", "wine", "gastronomy"],
    assigned_advisor_id: "user-marco",
    assigned_advisor_name: "Marco Pellegrini",
    vic_since: "2020-03-01",
    referral_source: "Event",
    relationship_status: "active",
    vip_notes: "Known entrepreneur. Met at Monaco event 2024.",
    acuity_status: "complete",
    acuityStatus: "complete",
    acuity_last_run: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    acuityLastRun: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    acuity_provider: "Gemini",
    acuity_confidence: "high",
    field_provenance: (() => {
      const t = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const t1 = new Date(t.getTime() + 60 * 1000);
      const t2 = new Date(t.getTime() + 2 * 60 * 1000);
      const isoT = iso(t);
      const isoT1 = iso(t1);
      const isoT2 = iso(t2);
      return {
        preferred_name: {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "high" as const,
          sourced_at: isoT,
          verified: true,
          raw_excerpt: 'Known as "JC" in Virtuoso adviser circles',
        },
        title: {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "high" as const,
          sourced_at: isoT,
          verified: true,
          raw_excerpt: "CEO, Maison Laurent Group — LinkedIn profile",
        },
        nationality: { source: "manual" as const, verified: true },
        home_city: {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "high" as const,
          sourced_at: isoT,
          verified: true,
          raw_excerpt: "Based in Paris — LinkedIn location, company HQ",
        },
        home_country: { source: "acuity" as const, provider: "gemini", confidence: "high" as const, sourced_at: isoT, verified: true },
        time_zone: { source: "acuity" as const, provider: "gemini", confidence: "high" as const, sourced_at: isoT, verified: true },
        language_primary: { source: "acuity" as const, provider: "gemini", confidence: "high" as const, sourced_at: isoT, verified: true },
        languages_spoken: {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "medium" as const,
          sourced_at: isoT,
          verified: false,
          raw_excerpt: "Posts in French and English; interviewed in Italian for Corriere della Sera",
        },
        "leisure.accommodation_types": {
          source: "acuity" as const,
          provider: "perplexity",
          confidence: "high" as const,
          sourced_at: isoT2,
          verified: true,
          raw_excerpt: "Instagram posts at Aman Tokyo, Cheval Blanc St-Barth, Four Seasons Bora Bora",
        },
        "leisure.cuisine_preferences": {
          source: "acuity" as const,
          provider: "perplexity",
          confidence: "medium" as const,
          sourced_at: isoT2,
          verified: true,
          raw_excerpt: "Multiple posts from Michelin-starred restaurants; wine tasting events",
        },
        "leisure.dining_style": { source: "acuity" as const, provider: "perplexity", confidence: "high" as const, sourced_at: isoT2, verified: true },
        "leisure.experience_themes": {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "high" as const,
          sourced_at: isoT1,
          verified: true,
          raw_excerpt: "Wine, motorsport (F1 paddock photos), contemporary art (gallery openings)",
        },
        "leisure.activities_loved": {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "medium" as const,
          sourced_at: isoT1,
          verified: true,
          raw_excerpt: "Sailing, F1, gallery openings, wine tastings",
        },
        "leisure.budget_range": {
          source: "acuity" as const,
          provider: "perplexity",
          confidence: "high" as const,
          sourced_at: isoT2,
          verified: true,
          raw_excerpt: "Properties visited are consistently ultra-luxury tier (Aman, Cheval Blanc, One&Only)",
        },
        "leisure.preferred_airlines": {
          source: "acuity" as const,
          provider: "perplexity",
          confidence: "medium" as const,
          sourced_at: isoT2,
          verified: false,
          raw_excerpt: "Air France La Première lounge check-in (Instagram story)",
        },
        "leisure.destinations_visited": {
          source: "acuity" as const,
          provider: "perplexity",
          confidence: "high" as const,
          sourced_at: isoT2,
          verified: true,
          raw_excerpt: "Geotagged: Tokyo, Bora Bora, St-Barth, Monaco, Tuscany, Marrakech, Maldives",
        },
        "leisure.destinations_preferred": {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "medium" as const,
          sourced_at: isoT1,
          verified: true,
          raw_excerpt: "Asia-Pacific islands, Mediterranean coast, Alpine winter",
        },
        loyalty_programs: {
          source: "acuity" as const,
          provider: "perplexity",
          confidence: "medium" as const,
          sourced_at: isoT2,
          verified: false,
          raw_excerpt: "Aman Junkies reference in travel forum; Air France Flying Blue Platinum mentioned in lounge post",
        },
        customTags: {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "high" as const,
          sourced_at: isoT1,
          verified: true,
          raw_excerpt: "wine, motorsport, art collector, gastronomy",
        },
        familyContext: {
          source: "acuity" as const,
          provider: "gemini",
          confidence: "low" as const,
          sourced_at: isoT1,
          verified: false,
          raw_excerpt: "Family photos on Instagram suggest spouse + 2 children (school-age). Anniversary trip post from St-Barth.",
        },
      };
    })(),
    relationship_insights: [
      { id: "ri1", text: "CEO at Maison Laurent, luxury fashion group", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri2", text: "Board member at Kering Group", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri3", text: "Featured in Forbes France \"Les 500\" list", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri4", text: "Connected to Sophie Laurent via Rothschild & Co", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri5", text: "Patron of Fondation Louis Vuitton", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri6", text: "Mentioned in Virtuoso Life Magazine, March 2025", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri7", text: "Industry: luxury goods, fashion, wine & spirits", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri8", text: "Education: INSEAD MBA, Sciences Po Paris", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "ri9", text: "Active on Instagram (~12K followers), wine & travel content", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
    ],
    travel_discovered_preferences: [
      { id: "td1", text: "Overwater villas & Aman-class resorts", profile_type: "leisure", provider: "Perplexity", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td2", text: "Michelin dining & wine regions (Barolo, Burgundy)", profile_type: "leisure", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td3", text: "F1 & motorsport events", profile_type: "leisure", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td4", text: "Contemporary art & gallery openings", profile_type: "leisure", provider: "Gemini", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
      { id: "td5", text: "Air France La Première / long-haul first", profile_type: "business", provider: "Perplexity", sourced_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)) },
    ],
    created_by: "2",
    createdBy: "2",
    created_by_name: "Marco Pellegrini",
    createdByName: "Marco Pellegrini",
    updated_by: "2",
    updated_by_name: "Marco Pellegrini",
    created_at: iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
    updated_at: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
    phone: "+33 6 12 34 56 78",
    notes: "Known entrepreneur with interests in wine and gastronomy.",
    familyContext: "Married, children are adults (~30s).",
    preferences: "Fine wine, contemporary art, Mediterranean cuisine",
    shared_with: [{ advisor_id: "1", advisor_name: "Marco Pellegrini", access_level: "edit", shared_at: iso(now) }],
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
    linked_product_ids: ["prod_001", "prod_006", "prod-rest-001"],
    linked_itinerary_ids: ["itin-001"],
    acuityProfile:
      "## SNAPSHOT\nJean-Christophe Chopin · CEO, Maison Laurent Group · Paris, France\nWealth tier: HIGH · Data availability: Rich\n\n## ACTIONABLE INSIGHTS\nWine, motorsport, contemporary art, ultra-luxury travel | Confidence: HIGH",
    edit_history: [
      { by: "Marco Pellegrini", at: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)), change: "Updated contact details" },
      { by: "Marco Pellegrini", at: iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), change: "Created VIC" },
    ],
  } as VIC,
  // —— Owned by current user "1" (5 total: Dom, Camille, Eric, Isabelle, Gad) ——
  {
    id: "vic-002",
    _id: "vic-002",
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
    assigned_advisor_name: "Marco Pellegrini",
    vic_since: "2023-06-01",
    referral_source: "Referral",
    relationship_status: "prospect",
    acuity_status: "not_run",
    acuityStatus: "not_run",
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marco Pellegrini",
    createdByName: "Marco Pellegrini",
    updated_by: "1",
    updated_by_name: "Marco Pellegrini",
    created_at: iso(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)),
    updated_at: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
    passport_number: "****1234",
    passport_country: "FR",
    passport_expiry: passportExpirySoon,
    linked_product_ids: ["prod-villa-001", "prod-rest-001"],
    linked_itinerary_ids: ["itin-002"],
    notes: "Referred by Jean-Christophe. Interested in incentive travel.",
  } as VIC,
  {
    id: "vic-003",
    _id: "vic-003",
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
    assigned_advisor_name: "Marco Pellegrini",
    vic_since: "2024-01-15",
    relationship_status: "inactive",
    acuity_status: "not_run",
    acuityStatus: "not_run",
    field_provenance: {},
    date_of_birth: birthdaySoon,
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marco Pellegrini",
    createdByName: "Marco Pellegrini",
    updated_by: "1",
    updated_by_name: "Marco Pellegrini",
    created_at: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    linked_product_ids: ["prod_002", "prod_009"],
    linked_itinerary_ids: ["itin-003"],
  } as VIC,
  {
    id: "vic-004",
    _id: "vic-004",
    full_name: "Eric Tournier",
    title: "Wealth Advisor",
    home_city: "Geneva",
    home_country: "Switzerland",
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
      title: {
        source: "acuity",
        provider: "perplexity",
        confidence: "medium",
        sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)),
        verified: true,
      },
      home_city: {
        source: "acuity",
        provider: "perplexity",
        confidence: "medium",
        sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)),
        verified: true,
      },
      home_country: {
        source: "acuity",
        provider: "perplexity",
        confidence: "high",
        sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)),
        verified: true,
      },
      "leisure.experience_themes": {
        source: "acuity",
        provider: "perplexity",
        confidence: "medium",
        sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000 + 60 * 1000)),
        verified: false,
        raw_excerpt: "Swiss Alps ski, discreet luxury events, Geneva private banking circuit",
      },
      "leisure.destinations_visited": {
        source: "acuity",
        provider: "perplexity",
        confidence: "medium",
        sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000 + 60 * 1000)),
        verified: false,
        raw_excerpt: "Zermatt, St. Moritz, Courchevel; occasional London & NYC",
      },
      "leisure.cuisine_preferences": {
        source: "acuity",
        provider: "perplexity",
        confidence: "low",
        sourced_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000 + 60 * 1000)),
        verified: false,
        raw_excerpt: "Limited public dining posts — inferred from event attendance only",
      },
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
    assigned_advisor_name: "Marco Pellegrini",
    vic_since: "2022-06-15",
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marco Pellegrini",
    createdByName: "Marco Pellegrini",
    updated_by: "1",
    updated_by_name: "Marco Pellegrini",
    created_at: iso(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)),
    updated_at: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
    email: "e.tournier@example.ch",
    passport_number: "****5678",
    passport_country: "CH",
    passport_expiry: iso(new Date(now.getTime() + 400 * 24 * 60 * 60 * 1000)),
    notes: "UHNW VIC. Prefers discreet, high-touch service.",
    acuityProfile: "## SNAPSHOT\nEric Tournier · Wealth Advisor · Geneva, Switzerland\nWealth tier: UHNW · Focus: Discretion, family office coordination.",
    relationship_status: "active",
    linked_product_ids: ["prod_001", "prod_003"],
    linked_itinerary_ids: [],
  } as VIC,
  {
    id: "vic-005",
    _id: "vic-005",
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
    assigned_advisor_name: "Marco Pellegrini",
    vic_since: "2024-02-01",
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marco Pellegrini",
    createdByName: "Marco Pellegrini",
    updated_by: "1",
    updated_by_name: "Marco Pellegrini",
    created_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    notes: "Art and design focus. Attends Art Basel, Venice Biennale.",
    relationship_status: "prospect",
    loyalty_programs: [
      { id: "lp1", program_name: "Marriott Bonvoy", membership_id: "MB-****5678", tier: "Titanium", added_at: iso(now) },
    ],
    loyaltyPrograms: "Marriott Bonvoy",
    linked_product_ids: ["prod-well-001", "prod_007"],
    linked_itinerary_ids: [],
  } as VIC,
  // —— Agency-published (Jacques owned by other "2") ——
  {
    id: "vic-006",
    _id: "vic-006",
    full_name: "Jacques Veyrat",
    email: "j.veyrat@example.com",
    phone_primary: "+44 20 XXXX XXXX",
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
    created_by_name: "Claire Dubois",
    createdByName: "Claire Dubois",
    updated_by: "2",
    updated_by_name: "Claire Dubois",
    created_at: iso(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    is_shared_to_agency: true,
    relationship_status: "past",
    notes: "Acuity run failed last time; retry pending.",
  } as VIC,
  // —— Agency-published (Sophie owned by Claire "4") ——
  {
    id: "vic-007",
    _id: "vic-007",
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
    id: "vic-008",
    _id: "vic-008",
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
    assigned_advisor_name: "Marco Pellegrini",
    vic_since: "2021-09-01",
    created_by: "1",
    createdBy: "1",
    created_by_name: "Marco Pellegrini",
    createdByName: "Marco Pellegrini",
    updated_by: "1",
    updated_by_name: "Marco Pellegrini",
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
  // —— Owned by OTHER (Claire "3") — Shared with Me (basic) ——
  {
    id: "vic-009",
    _id: "vic-009",
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
    created_by_name: "Claire Dubois",
    createdByName: "Claire Dubois",
    updated_by: "3",
    updated_by_name: "Claire Dubois",
    created_at: iso(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
    createdAt: iso(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
    updated_at: iso(now),
    relationship_status: "do_not_contact",
    shared_with: [{ advisor_id: "1", advisor_name: "Marco Pellegrini", access_level: "view", shared_at: iso(now) }],
    sharing_level: "basic",
  } as VIC,
  // —— More VICs for richer list/demo ——
  { id: "vic-010", _id: "vic-010", full_name: "Claire Mérigot", email: "claire@example.com", city: "Geneva", country: "Switzerland", company: "Mérigot & Associés", role: "Director", customTags: ["vip", "corporate"], tags: ["vip", "corporate"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", assigned_advisor_name: "Claire Dubois", vic_since: "2022-01-15", sharing_level: "basic", shared_with_teams: [{ team_id: "team-europe", team_name: "Europe Specialists", access_level: "view", shared_at: iso(now) }], notes: "Luxury ski and city breaks." } as VIC,
  { id: "vic-011", _id: "vic-011", full_name: "Thomas Bresson", email: "thomas.b@firm.fr", city: "Lyon", country: "France", company: "Bresson Industries", role: "CEO", customTags: ["luxury", "wine"], tags: ["luxury", "wine"], acuity_status: "running", acuityStatus: "running", relationship_status: "prospect", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)), updated_at: iso(now), notes: "Wine enthusiast, Burgundy focus.", linked_product_ids: ["prod-rest-001"], linked_itinerary_ids: ["itin-006"] } as VIC,
  { id: "vic-012", _id: "vic-012", full_name: "Anne-Sophie Durand", city: "Cannes", country: "France", company: "—", role: "—", customTags: ["vip", "gastronomy", "luxury"], tags: ["vip", "gastronomy", "luxury"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", assigned_advisor_name: "Claire Dubois", vic_since: "2023-06-01", preferences: "Riviera, Michelin dining, yachting." } as VIC,
  { id: "vic-013", _id: "vic-013", full_name: "Marc Lefebvre", email: "marc@lefebvre.co", city: "Brussels", country: "Belgium", company: "Lefebvre Capital", role: "Partner", customTags: ["corporate", "new"], tags: ["corporate", "new"], acuity_status: "not_run", acuityStatus: "not_run", relationship_status: "prospect", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), updated_at: iso(now), notes: "MICE and incentive travel interest." } as VIC,
  { id: "vic-014", _id: "vic-014", full_name: "Valérie Rousseau", email: "valerie.r@example.com", phone_primary: "+33 1 XX XX XX XX", city: "Paris", country: "France", company: "Rousseau Art", role: "Founder", customTags: ["vip", "luxury"], tags: ["vip", "luxury"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", assigned_advisor_name: "Claire Dubois", vic_since: "2021-04-01", preferences: "Art-focused travel, private viewings.", linked_product_ids: ["prod-waldorf-london", "prod-villa-001"], linked_itinerary_ids: ["itin-004"] } as VIC,
  { id: "vic-015", _id: "vic-015", full_name: "Philippe Moreau", email: "p.moreau@group.com", city: "Marseille", country: "France", company: "Moreau Group", role: "Managing Director", customTags: ["corporate"], tags: ["corporate"], acuity_status: "failed", acuityStatus: "failed", relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", assigned_advisor_name: "Claire Dubois", notes: "Corporate retreats, Provence and Côte d'Azur." } as VIC,
  { id: "vic-016", _id: "vic-016", full_name: "Hélène Petit", city: "Bordeaux", country: "France", company: "—", role: "—", customTags: ["wine", "gastronomy"], tags: ["wine", "gastronomy"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", vic_since: "2020-09-01", preferences: "Wine tours, châteaux stays." } as VIC,
  { id: "vic-017", _id: "vic-017", full_name: "Nicolas Bernard", email: "n.bernard@example.com", phone_primary: "+41 44 XXX XX XX", city: "Zurich", country: "Switzerland", company: "Bernard Wealth", role: "Advisor", customTags: ["vip", "luxury", "corporate"], tags: ["vip", "luxury", "corporate"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", vic_since: "2024-02-01", is_shared_to_agency: true, notes: "Alpine and city luxury." } as VIC,
  { id: "vic-018", _id: "vic-018", full_name: "Sandra Müller", city: "Munich", country: "Germany", company: "Müller GmbH", role: "Owner", customTags: ["new", "corporate"], tags: ["new", "corporate"], acuity_status: "not_run", acuityStatus: "not_run", relationship_status: "prospect", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)), updated_at: iso(now), email: "sandra@mueller.de", notes: "Incoming lead, DACH travel." } as VIC,
  { id: "vic-019", _id: "vic-019", full_name: "Laurent Dubois", city: "Monaco", country: "Monaco", company: "Dubois & Fils", role: "Director", customTags: ["vip", "luxury"], tags: ["vip", "luxury"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", vic_since: "2019-11-01", preferences: "Grand Prix, yacht, fine dining." } as VIC,
  { id: "vic-020", _id: "vic-020", full_name: "Catherine Leroy", email: "catherine.leroy@example.com", phone_primary: "+33 4 93 XX XX XX", city: "Nice", country: "France", company: "—", role: "—", customTags: ["gastronomy", "luxury"], tags: ["gastronomy", "luxury"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)), relationship_status: "inactive", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", vic_since: "2018-05-01", notes: "Long-standing VIC, low recent activity." } as VIC,
  { id: "vic-021", _id: "vic-021", full_name: "Olivier Martin", email: "olivier.m@consulting.fr", city: "Paris", country: "France", company: "Martin Consulting", role: "Partner", customTags: ["corporate", "new"], tags: ["corporate", "new"], acuity_status: "not_run", acuityStatus: "not_run", relationship_status: "prospect", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), updated_at: iso(now), notes: "Incentive travel, team offsites." } as VIC,
  { id: "vic-022", _id: "vic-022", full_name: "Isabelle Blanc", email: "isabelle.blanc@example.com", phone_primary: "+41 21 XXX XX XX", city: "Lausanne", country: "Switzerland", company: "Blanc Foundation", role: "Trustee", customTags: ["vip", "luxury", "wine"], tags: ["vip", "luxury", "wine"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", vic_since: "2023-01-10", is_shared_to_agency: true, preferences: "Lake Geneva, Alps, wellness." } as VIC,
  { id: "vic-023", _id: "vic-023", full_name: "Pierre Garnier", city: "London", country: "United Kingdom", company: "Garnier Holdings", role: "CEO", customTags: ["vip", "corporate"], tags: ["vip", "corporate"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", vic_since: "2022-08-01", email: "p.garnier@garnier.co.uk", notes: "UK and Europe business travel." } as VIC,
  { id: "vic-024", _id: "vic-024", full_name: "Marie-Claire Fontaine", city: "Cannes", country: "France", company: "—", role: "—", customTags: ["vip", "gastronomy", "luxury"], tags: ["vip", "gastronomy", "luxury"], acuity_status: "complete", acuityStatus: "complete", acuity_last_run: iso(new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000)), acuityLastRun: iso(new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000)), relationship_status: "active", created_by: "2", createdBy: "2", created_by_name: "Claire Dubois", createdByName: "Claire Dubois", updated_by: "2", updated_by_name: "Claire Dubois", created_at: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)), createdAt: iso(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)), updated_at: iso(now), assigned_advisor_id: "2", vic_since: "2025-02-01", preferences: "Film festival, Riviera, private events." } as VIC,
];

/** All unique tag values used in fake data (for filter dropdown). */
export const FAKE_VIC_TAG_OPTIONS = ["vip", "wine", "gastronomy", "luxury", "new", "corporate"];

/** All unique countries in fake data. */
export const FAKE_VIC_COUNTRIES = ["France", "Switzerland", "Monaco", "United Kingdom", "United States", "Germany", "Belgium"];

export interface FilterParams {
  tab?: "mine" | "shared";
  userId?: string;
  /** Used with shared_with_teams for “Shared with me” tab; defaults to workspace mock teams. */
  teams?: Team[];
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

function isSharedWith(vic: VIC, userId: string, teams: Team[]): boolean {
  if (vic.shared_with?.some((s) => String(s.advisor_id) === userId)) return true;
  const memberTeamIds = new Set(teams.filter((t) => t.memberIds.some((m) => String(m) === userId)).map((t) => t.id));
  return !!vic.shared_with_teams?.some((s) => memberTeamIds.has(s.team_id));
}

/** Filter, sort, and paginate a VIC list (for fake data in dev). */
export function filterAndPaginateFakeVics(
  list: VIC[],
  params: FilterParams
): { vics: VIC[]; total: number } {
  let out = [...list];
  // When tab is "mine" and no user (e.g. preview), use "1" so My VICs shows owned subset, not all.
  const uid = params.userId != null ? String(params.userId) : params.tab === "mine" ? "1" : null;
  const teamsForShare = params.teams?.length ? params.teams : INITIAL_MOCK_TEAMS;
  if (params.tab && uid) {
    switch (params.tab) {
      case "mine":
        out = out.filter((v) => isOwner(v, uid));
        break;
      case "shared":
        out = out.filter((v) => isSharedWith(v, uid, teamsForShare) && !isOwner(v, uid));
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
