/**
 * Prototype seed for Briefing “catch up” — one card at a time, one primary action each.
 */

export type BriefingCatchUpClass =
    | "news_alerts"
    | "partner_incentives"
    | "vic"
    | "itinerary"
    | "product";

export type BriefingCatchUpItem = {
    id: string;
    informationClass: BriefingCatchUpClass;
    classLabel: string;
    title: string;
    summary: string;
    primaryActionLabel: string;
    /** Prototype: no routing yet */
    primaryActionHref?: string;
};

export const BRIEFING_CATCH_UP_CLASS_LABELS: Record<BriefingCatchUpClass, string> = {
    news_alerts: "News & alerts",
    partner_incentives: "Partner incentives",
    vic: "VIC",
    itinerary: "Itinerary",
    product: "Product",
};

export function getBriefingCatchUpSeed(): BriefingCatchUpItem[] {
    return [
        {
            id: "cu-1",
            informationClass: "news_alerts",
            classLabel: BRIEFING_CATCH_UP_CLASS_LABELS.news_alerts,
            title: "Supplier policy update — Europe rail",
            summary:
                "A major rail partner published new amendment rules for 2026 departures. Review before quoting new trips.",
            primaryActionLabel: "Read summary",
        },
        {
            id: "cu-2",
            informationClass: "partner_incentives",
            classLabel: BRIEFING_CATCH_UP_CLASS_LABELS.partner_incentives,
            title: "Q2 bonus tier unlocked",
            summary: "Your agency crossed the incentive threshold for two preferred hotel programs this quarter.",
            primaryActionLabel: "View incentives",
        },
        {
            id: "cu-3",
            informationClass: "vic",
            classLabel: BRIEFING_CATCH_UP_CLASS_LABELS.vic,
            title: "Jordan Lee — passport expiring soon",
            summary: "Passport on file expires in 4 months. Proactive outreach recommended before peak booking season.",
            primaryActionLabel: "Open VIC profile",
            primaryActionHref: "/dashboard/vics",
        },
        {
            id: "cu-4",
            informationClass: "itinerary",
            classLabel: BRIEFING_CATCH_UP_CLASS_LABELS.itinerary,
            title: "Deposit due — Amalfi June trip",
            summary: "Final deposit for the Martin party is due in 3 business days.",
            primaryActionLabel: "Open itinerary",
            primaryActionHref: "/dashboard/itineraries",
        },
    ];
}
