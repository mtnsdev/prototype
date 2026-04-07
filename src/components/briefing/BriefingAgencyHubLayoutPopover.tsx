"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
    AGENCY_HUB_USER_WIDGET_META,
    type AgencyHubUserWidgetId,
    type AgencyHubUserWidgetLayout,
} from "@/lib/briefingAgencyHubUserLayout";
import { BriefingCardLayoutForm } from "./briefingWidgetLayoutUi";

type Props = {
    widgetId: AgencyHubUserWidgetId;
    pref: AgencyHubUserWidgetLayout;
    updateWidget: (id: AgencyHubUserWidgetId, patch: Partial<AgencyHubUserWidgetLayout>) => void;
    disabled?: boolean;
};

export default function BriefingAgencyHubLayoutPopover({ widgetId, pref, updateWidget, disabled }: Props) {
    const [open, setOpen] = useState(false);
    const meta = AGENCY_HUB_USER_WIDGET_META[widgetId];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-lg text-muted-foreground hover:bg-muted/45 hover:text-foreground"
                    disabled={disabled}
                    title={`Layout — ${meta.label}`}
                    aria-label={`Layout options for ${meta.label}`}
                >
                    <SlidersHorizontal className="size-3.5" strokeWidth={2} />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[min(100vw-2rem,20rem)] border-border bg-popover p-4 text-popover-foreground shadow-xl"
            >
                <div className="space-y-3">
                    <div>
                        <p className="text-[15px] font-semibold leading-tight text-foreground">{meta.label}</p>
                        <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{meta.description}</p>
                    </div>
                    <BriefingCardLayoutForm
                        widgetId={widgetId}
                        meta={meta}
                        pref={pref}
                        updateWidget={updateWidget}
                        disabled={disabled}
                        idSuffix="hub-popover"
                        showToggleLabel="Show in agency briefing"
                        switchAriaScope="agency briefing"
                    />
                    <p className="text-[11px] leading-relaxed text-muted-foreground/75">
                        Agency staff still choose the content. This only changes how you see it. If you hide
                        blocks, use <span className="font-medium text-foreground/85">Reset agency layout</span>{" "}
                        above when it appears.
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
