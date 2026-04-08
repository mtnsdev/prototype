"use client";

import { useUserOptional } from "@/contexts/UserContext";

/**
 * Explains data scope and freshness for Claire — independent advisor vs agency ops lens.
 */
export default function ClaireDataAttributionBar() {
    const userContext = useUserOptional();
    const opsLens = userContext?.prototypeAdminView ?? false;

    return (
        <div className="shrink-0 border-b border-border/80 bg-muted/10 px-3 py-2">
            <p className="text-2xs leading-relaxed text-muted-foreground/90">
                <span className="font-medium text-foreground/85">Scope:</span>{" "}
                {opsLens
                    ? "Agency-wide knowledge, shared briefing context, and team-visible sources (prototype sample)."
                    : "Your workspace — your VICs, itineraries, and documents you personally can access (prototype sample)."}
                <span className="mx-1 text-muted-foreground/50">·</span>
                <span className="font-medium text-foreground/85">Freshness:</span> Claire uses the latest content
                indexed for your scope; in production, vault sync is continuous with a short lag (here: demo data
                only).
            </p>
        </div>
    );
}
