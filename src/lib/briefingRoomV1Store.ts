/**
 * Briefing Room v1 — admin-curated widget content (prototype: localStorage).
 * Production: replace with API-backed CMS.
 */

export type AnnouncementPriority = "info" | "important" | "urgent";

export type BriefingV1Announcement = {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  pinned: boolean;
  published: boolean;
  /** ISO — optional; hidden after this instant */
  expiresAt?: string | null;
  createdAt: string;
};

export type CommissionCategory = "hotel" | "cruise" | "tour" | "experience" | "other";

export type BriefingV1Commission = {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  commissionLabel: string;
  validFrom: string;
  validUntil: string;
  category: CommissionCategory;
  region?: string;
  link?: string;
  published: boolean;
};

export type FeaturedType = "property" | "destination" | "document" | "collection" | "article" | "resource";

export type BriefingV1Featured = {
  id: string;
  title: string;
  description: string;
  typeTag: FeaturedType;
  href: string;
  thumbUrl?: string;
  published: boolean;
  expiresAt?: string | null;
};

export type KvHighlightCategory = "program update" | "destination guide" | "training" | "policy" | "new addition";

export type BriefingV1KvHighlight = {
  id: string;
  title: string;
  description: string;
  documentHref: string;
  category: KvHighlightCategory;
  published: boolean;
  expiresAt?: string | null;
  isNew: boolean;
};

export type BriefingV1State = {
  announcements: BriefingV1Announcement[];
  commissions: BriefingV1Commission[];
  featured: BriefingV1Featured[];
  kvHighlights: BriefingV1KvHighlight[];
};

export const BRIEFING_V1_STORAGE_KEY = "enable_briefing_v1_cms_v1";

export function defaultBriefingV1State(): BriefingV1State {
  const now = new Date().toISOString();
  return {
    announcements: [
      {
        id: "ann-1",
        title: "Virtuoso Travel Week — registration closes soon",
        body: "Please submit your preferred sessions by Friday. [Event details](https://example.com)",
        priority: "important",
        pinned: true,
        published: true,
        expiresAt: null,
        createdAt: now,
      },
      {
        id: "ann-2",
        title: "New partner incentives live in the catalog",
        body: "Summer boosts are rolling out — check **Commission opportunities** for the latest.",
        priority: "info",
        pinned: false,
        published: true,
        expiresAt: null,
        createdAt: now,
      },
    ],
    commissions: [
      {
        id: "com-1",
        title: "Aman — summer commission boost",
        description: "Qualifying bookings through Sept 30. See partner terms for suite categories.",
        partnerName: "Aman",
        commissionLabel: "15% + bonus",
        validFrom: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
        validUntil: new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10),
        category: "hotel",
        region: "Asia",
        link: "https://example.com",
        published: true,
      },
    ],
    featured: [
      {
        id: "feat-1",
        title: "Four Seasons Kyoto — refreshed Virtuoso amenities",
        description: "New FS club access and F&B credit for 2026.",
        typeTag: "property",
        href: "/dashboard/products",
        published: true,
      },
    ],
    kvHighlights: [
      {
        id: "kv-1",
        title: "Japan entry & rail updates (Q2)",
        description: "Policy refresher for advisors booking multi-city Japan.",
        documentHref: "/dashboard/knowledge-vault",
        category: "destination guide",
        published: true,
        isNew: true,
      },
    ],
  };
}

export function loadBriefingV1State(): BriefingV1State {
  if (typeof window === "undefined") return defaultBriefingV1State();
  try {
    const raw = localStorage.getItem(BRIEFING_V1_STORAGE_KEY);
    if (!raw) return defaultBriefingV1State();
    const parsed = JSON.parse(raw) as Partial<BriefingV1State>;
    const base = defaultBriefingV1State();
    return {
      announcements: Array.isArray(parsed.announcements) ? parsed.announcements : base.announcements,
      commissions: Array.isArray(parsed.commissions) ? parsed.commissions : base.commissions,
      featured: Array.isArray(parsed.featured) ? parsed.featured : base.featured,
      kvHighlights: Array.isArray(parsed.kvHighlights) ? parsed.kvHighlights : base.kvHighlights,
    };
  } catch {
    return defaultBriefingV1State();
  }
}

export function saveBriefingV1State(state: BriefingV1State): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRIEFING_V1_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("enable-briefing-v1-updated"));
  } catch {
    // ignore quota
  }
}

const PRIO: Record<AnnouncementPriority, number> = { urgent: 0, important: 1, info: 2 };

export function sortAnnouncementsForAdvisor(list: BriefingV1Announcement[]): BriefingV1Announcement[] {
  const t = Date.now();
  const active = list.filter((a) => {
    if (!a.published) return false;
    if (a.expiresAt) {
      const ex = new Date(a.expiresAt).getTime();
      if (!Number.isNaN(ex) && ex < t) return false;
    }
    return true;
  });
  return [...active].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const pa = PRIO[a.priority] ?? 2;
    const pb = PRIO[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function daysUntilEndYmd(endYmd: string): number {
  const [y, m, d] = endYmd.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime();
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

export function isYmdInRange(fromYmd: string, untilYmd: string): boolean {
  const t = Date.now();
  const [fy, fm, fd] = fromYmd.split("-").map(Number);
  const [uy, um, ud] = untilYmd.split("-").map(Number);
  if (!fy || !fm || !fd || !uy || !um || !ud) return true;
  const fromMs = new Date(fy, fm - 1, fd, 0, 0, 0, 0).getTime();
  const untilMs = new Date(uy, um - 1, ud, 23, 59, 59, 999).getTime();
  return t >= fromMs && t <= untilMs;
}

export function filterCommissionsForAdvisor(list: BriefingV1Commission[]): BriefingV1Commission[] {
  return list.filter((c) => {
    if (!c.published) return false;
    return isYmdInRange(c.validFrom, c.validUntil);
  });
}

export function sortCommissionsForAdvisor(list: BriefingV1Commission[]): BriefingV1Commission[] {
  return [...list].sort(
    (a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime(),
  );
}

export function filterFeaturedForAdvisor(list: BriefingV1Featured[]): BriefingV1Featured[] {
  const t = Date.now();
  return list.filter((f) => {
    if (!f.published) return false;
    if (f.expiresAt) {
      const ex = new Date(f.expiresAt).getTime();
      if (!Number.isNaN(ex) && ex < t) return false;
    }
    return true;
  });
}

export function filterKvForAdvisor(list: BriefingV1KvHighlight[]): BriefingV1KvHighlight[] {
  const t = Date.now();
  return list.filter((k) => {
    if (!k.published) return false;
    if (k.expiresAt) {
      const ex = new Date(k.expiresAt).getTime();
      if (!Number.isNaN(ex) && ex < t) return false;
    }
    return true;
  });
}

const DISMISS_PREFIX = "enable_briefing_v1_ann_read_";

export function dismissedAnnouncementKey(userKey: string): string {
  return `${DISMISS_PREFIX}${userKey}`;
}

export function loadDismissedAnnouncementIds(userKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(dismissedAnnouncementKey(userKey));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

export function saveDismissedAnnouncementIds(userKey: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(dismissedAnnouncementKey(userKey), JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}
