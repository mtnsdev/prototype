import { z } from "zod";

export type PartnerPortalIncentiveKind = "commission" | "bonus" | "amenity" | "upgrade";

export interface PartnerPortalIncentive {
  id: string;
  name: string;
  valueLabel: string;
  validFrom: string;
  validUntil: string;
  conditions: string;
  kind: PartnerPortalIncentiveKind;
}

export interface PartnerPortalProgramCard {
  id: string;
  /** Display name of the partner program */
  name: string;
  /** Brand / consortium (e.g. Virtuoso, Four Seasons) */
  network: string;
  /** Program tier or level shown to advisors */
  tier: string;
  status: "active" | "expiring-soon" | "inactive";
  /** Optional overview: eligibility, booking codes, contact hints */
  notes: string;
  incentives: PartnerPortalIncentive[];
}

const incentiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  valueLabel: z.string(),
  validFrom: z.string(),
  validUntil: z.string(),
  conditions: z.string(),
  kind: z.enum(["commission", "bonus", "amenity", "upgrade"]),
});

const programSchema = z.object({
  id: z.string(),
  name: z.string(),
  network: z.string(),
  tier: z.string(),
  status: z.enum(["active", "expiring-soon", "inactive"]),
  notes: z.string().optional().default(""),
  incentives: z.array(incentiveSchema),
});

const rootSchema = z.array(programSchema);

export const PARTNER_PORTAL_STORAGE_KEY = "enable_partner_portal_programs_v1";

export const PARTNER_PORTAL_DEMO_PROGRAMS: PartnerPortalProgramCard[] = [
  {
    id: "pp-fs-preferred",
    name: "Four Seasons Preferred Partner",
    network: "Four Seasons",
    tier: "Preferred Partner",
    status: "active",
    notes: "Global preferred rates; advisor must disclose Virtuoso affiliation at booking.",
    incentives: [
      {
        id: "inc-fs-1",
        name: "Spring override — Americas",
        valueLabel: "+3%",
        validFrom: "2026-03-01",
        validUntil: "2026-05-31",
        conditions: "New bookings only; min 3 nights; Virtuoso rate code.",
        kind: "commission",
      },
      {
        id: "inc-fs-2",
        name: "Breakfast & credit bundle",
        valueLabel: "$200",
        validFrom: "2026-01-01",
        validUntil: "2026-12-31",
        conditions: "One per stay; not combinable with member rate.",
        kind: "amenity",
      },
    ],
  },
  {
    id: "pp-virtuoso-hr",
    name: "Virtuoso Hotels & Resorts",
    network: "Virtuoso",
    tier: "Hotels & Resorts",
    status: "active",
    notes: "Member hotels worldwide under Virtuoso umbrella agreements.",
    incentives: [
      {
        id: "inc-v-1",
        name: "Q2 booking bonus pool",
        valueLabel: "$1,000",
        validFrom: "2026-04-01",
        validUntil: "2026-06-30",
        conditions: "Agency-wide targets; paid after quarter close.",
        kind: "bonus",
      },
      {
        id: "inc-v-2",
        name: "Suite upgrade certificate",
        valueLabel: "1 category",
        validFrom: "2026-02-15",
        validUntil: "2026-08-15",
        conditions: "Subject to availability; blackout dates apply.",
        kind: "upgrade",
      },
    ],
  },
  {
    id: "pp-aman-pref",
    name: "Aman Preferred",
    network: "Aman",
    tier: "Preferred",
    status: "expiring-soon",
    notes: "Renewal in progress — confirm rates before quoting.",
    incentives: [
      {
        id: "inc-a-1",
        name: "Virtuoso program override",
        valueLabel: "+2%",
        validFrom: "2026-01-01",
        validUntil: "2026-06-30",
        conditions: "All Aman resorts; advisor must register booking.",
        kind: "commission",
      },
    ],
  },
  {
    id: "pp-belmond-bellini",
    name: "Belmond Bellini Club",
    network: "Belmond",
    tier: "Bellini Club",
    status: "active",
    notes: "Italy-heavy portfolio; Bellini rate code required on all bookings.",
    incentives: [
      {
        id: "inc-b-1",
        name: "FAM trip credit — Italy",
        valueLabel: "€2,500",
        validFrom: "2026-05-01",
        validUntil: "2026-07-31",
        conditions: "Hosted stay; companion booking required.",
        kind: "bonus",
      },
      {
        id: "inc-b-2",
        name: "Club lounge access",
        valueLabel: "Included",
        validFrom: "2026-01-01",
        validUntil: "2026-12-31",
        conditions: "Bellini rate only; one room.",
        kind: "amenity",
      },
    ],
  },
];

/** Editable fields for the program shell (above incentives). */
export type PartnerPortalProgramMeta = Pick<
  PartnerPortalProgramCard,
  "name" | "network" | "tier" | "status" | "notes"
>;

export function programMetaFromCard(p: PartnerPortalProgramCard): PartnerPortalProgramMeta {
  return {
    name: p.name,
    network: p.network,
    tier: p.tier,
    status: p.status,
    notes: p.notes ?? "",
  };
}

export function programMetaEqual(a: PartnerPortalProgramMeta, b: PartnerPortalProgramMeta): boolean {
  return (
    a.name === b.name &&
    a.network === b.network &&
    a.tier === b.tier &&
    a.status === b.status &&
    a.notes === b.notes
  );
}

export function clonePartnerPortalPrograms(programs: PartnerPortalProgramCard[]): PartnerPortalProgramCard[] {
  return programs.map((p) => ({
    ...p,
    incentives: p.incentives.map((i) => ({ ...i })),
  }));
}

/** Matches legacy `partnerProgramCardDomId` in ProductDirectoryTabsViews for `?program=` deep links. */
export function partnerPortalProgramDomId(programKey: string): string {
  return `partner-program-${programKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/** Mask incentive amounts when the user cannot view commissions (list + non-edit surfaces). */
export function formatPartnerPortalValueDisplay(valueLabel: string, canViewCommissions: boolean): string {
  if (canViewCommissions) return valueLabel;
  return "—";
}

export function loadPartnerPortalProgramsFromStorage(): PartnerPortalProgramCard[] {
  if (typeof window === "undefined") return clonePartnerPortalPrograms(PARTNER_PORTAL_DEMO_PROGRAMS);
  try {
    const raw = window.localStorage.getItem(PARTNER_PORTAL_STORAGE_KEY);
    if (!raw) return clonePartnerPortalPrograms(PARTNER_PORTAL_DEMO_PROGRAMS);
    const parsed = JSON.parse(raw) as unknown;
    const data = rootSchema.safeParse(parsed);
    if (!data.success) return clonePartnerPortalPrograms(PARTNER_PORTAL_DEMO_PROGRAMS);
    return clonePartnerPortalPrograms(data.data as PartnerPortalProgramCard[]);
  } catch {
    return clonePartnerPortalPrograms(PARTNER_PORTAL_DEMO_PROGRAMS);
  }
}

export function persistPartnerPortalPrograms(programs: PartnerPortalProgramCard[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PARTNER_PORTAL_STORAGE_KEY, JSON.stringify(programs));
  } catch {
    /* quota / private mode */
  }
}
