"use client";

import {
    type DragEndEvent,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical } from "lucide-react";
import { cloneElement, isValidElement, useMemo, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { BriefingWidget } from "@/types/briefing";
import type { WidgetCardDensity } from "./AppleWidgetCard";
import ActionItemsWidget from "./widgets/ActionItemsWidget";
import UpcomingTripsWidget from "./widgets/UpcomingTripsWidget";
import CalendarWidget from "./widgets/CalendarWidget";
import RecentActivityWidget from "./widgets/RecentActivityWidget";
import ClientIntelligenceWidget from "./widgets/ClientIntelligenceWidget";
import { cn } from "@/lib/utils";
import {
    BRIEFING_USER_GRID_WIDGET_IDS,
    USER_GRID_WIDGET_META,
    type BriefingUserGridWidgetId,
    type UserDashboardWidgetLayout,
} from "@/lib/briefingDashboardUserLayout";

const SORT_GRID = "briefing-sort-grid";

const CARD_DENSITY: WidgetCardDensity = "default";

/** Row-major 2-column order: (L0,R0), (L1,R1), … */
export function interleaveBriefingColumns(
    leftIds: BriefingUserGridWidgetId[],
    rightIds: BriefingUserGridWidgetId[],
): BriefingUserGridWidgetId[] {
    const out: BriefingUserGridWidgetId[] = [];
    const n = Math.max(leftIds.length, rightIds.length);
    for (let i = 0; i < n; i++) {
        if (leftIds[i]) out.push(leftIds[i]);
        if (rightIds[i]) out.push(rightIds[i]);
    }
    return out;
}

export function splitInterleavedBriefingColumns(
    flat: BriefingUserGridWidgetId[],
): { left: BriefingUserGridWidgetId[]; right: BriefingUserGridWidgetId[] } {
    const left: BriefingUserGridWidgetId[] = [];
    const right: BriefingUserGridWidgetId[] = [];
    flat.forEach((id, idx) => {
        if (idx % 2 === 0) left.push(id);
        else right.push(id);
    });
    return { left, right };
}

type Props = {
    widgets: BriefingWidget[];
    isAdmin: boolean;
    userLayout: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>;
    updateWidget: (id: BriefingUserGridWidgetId, patch: Partial<UserDashboardWidgetLayout>) => void;
    reorderWidgets: (leftIds: BriefingUserGridWidgetId[], rightIds: BriefingUserGridWidgetId[]) => void;
    layoutLoading: boolean;
    editLayout: boolean;
};

function sortIdsForColumn(
    ids: BriefingUserGridWidgetId[],
    column: "left" | "right",
    layout: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>,
    byId: Map<string, BriefingWidget>,
): BriefingUserGridWidgetId[] {
    return ids
        .filter((id) => layout[id].column === column && layout[id].visible && byId.has(id))
        .sort((a, b) => {
            const od = layout[a].order - layout[b].order;
            if (od !== 0) return od;
            return BRIEFING_USER_GRID_WIDGET_IDS.indexOf(a) - BRIEFING_USER_GRID_WIDGET_IDS.indexOf(b);
        });
}

function renderWidgetCore(
    id: BriefingUserGridWidgetId,
    w: BriefingWidget,
    staggerIndex: number,
    isAdmin: boolean,
): ReactElement | null {
    switch (id) {
        case "w-client-intel":
            return (
                <ClientIntelligenceWidget
                    content={w.content as import("@/types/briefing").ClientIntelligenceContent}
                    staggerIndex={staggerIndex}
                    cardDensity={CARD_DENSITY}
                />
            );
        case "w-actions":
            return (
                <ActionItemsWidget
                    content={w.content as import("@/types/briefing").ActionItemsContent}
                    staggerIndex={staggerIndex}
                    isAdmin={isAdmin}
                    cardDensity={CARD_DENSITY}
                />
            );
        case "w-activity":
            return (
                <RecentActivityWidget
                    content={w.content as import("@/types/briefing").RecentActivityContent}
                    staggerIndex={staggerIndex}
                    isAdmin={isAdmin}
                    cardDensity={CARD_DENSITY}
                />
            );
        case "w-trips":
            return (
                <UpcomingTripsWidget
                    content={w.content as import("@/types/briefing").UpcomingTripsContent}
                    staggerIndex={staggerIndex}
                    cardDensity={CARD_DENSITY}
                />
            );
        case "w-calendar":
            return (
                <CalendarWidget
                    content={w.content as import("@/types/briefing").CalendarContent}
                    staggerIndex={staggerIndex}
                    cardDensity={CARD_DENSITY}
                />
            );
        default:
            return null;
    }
}

function hideButtonOnly(
    id: BriefingUserGridWidgetId,
    layoutLoading: boolean,
    onHide: () => void,
): ReactNode {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="rounded-lg text-muted-foreground hover:bg-muted/45 hover:text-foreground"
            disabled={layoutLoading}
            title={`Hide ${USER_GRID_WIDGET_META[id].label}`}
            aria-label={`Hide ${USER_GRID_WIDGET_META[id].label}`}
            onClick={onHide}
        >
            <EyeOff className="size-3.5" strokeWidth={2} />
        </Button>
    );
}

function injectLayoutMenu(child: ReactElement | null, layoutMenu: ReactNode): ReactNode {
    if (!child || !isValidElement(child)) return child;
    return cloneElement(child as ReactElement<{ layoutMenu?: ReactNode }>, { layoutMenu });
}

function BriefingGridSortableCell({
    id,
    layoutLoading,
    onHide,
    children,
}: {
    id: BriefingUserGridWidgetId;
    layoutLoading: boolean;
    onHide: () => void;
    children: ReactElement;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const headerActions = (
        <div className="flex items-center gap-0.5">
            <button
                type="button"
                className={cn(
                    "inline-flex size-8 touch-none items-center justify-center rounded-lg text-muted-foreground",
                    "cursor-grab active:cursor-grabbing hover:bg-muted/45 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                aria-label={`Drag to reorder ${USER_GRID_WIDGET_META[id].label}`}
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-3.5" strokeWidth={2} />
            </button>
            <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="rounded-lg text-muted-foreground hover:bg-muted/45 hover:text-foreground"
                disabled={layoutLoading}
                title={`Hide ${USER_GRID_WIDGET_META[id].label}`}
                aria-label={`Hide ${USER_GRID_WIDGET_META[id].label}`}
                onClick={onHide}
            >
                <EyeOff className="size-3.5" strokeWidth={2} />
            </Button>
        </div>
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "min-h-[272px] h-full",
                isDragging && "z-10 opacity-[0.92]",
            )}
        >
            {injectLayoutMenu(children, headerActions)}
        </div>
    );
}

const gridClass =
    "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 sm:grid-flow-dense auto-rows-fr";

export default function BriefingGrid({
    widgets,
    isAdmin,
    userLayout,
    updateWidget,
    reorderWidgets,
    layoutLoading,
    editLayout,
}: Props) {
    const byId = new Map(widgets.map((x) => [x.id, x]));

    const leftIds = sortIdsForColumn([...BRIEFING_USER_GRID_WIDGET_IDS], "left", userLayout, byId);
    const rightIds = sortIdsForColumn([...BRIEFING_USER_GRID_WIDGET_IDS], "right", userLayout, byId);

    const flatIds = useMemo(
        () => interleaveBriefingColumns(leftIds, rightIds),
        [leftIds, rightIds],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const activeId = String(active.id) as BriefingUserGridWidgetId;
        const overId = String(over.id) as BriefingUserGridWidgetId;
        if (!BRIEFING_USER_GRID_WIDGET_IDS.includes(activeId) || !BRIEFING_USER_GRID_WIDGET_IDS.includes(overId)) {
            return;
        }
        const oldIndex = flatIds.indexOf(activeId);
        const newIndex = flatIds.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return;
        const nextFlat = arrayMove(flatIds, oldIndex, newIndex);
        const { left, right } = splitInterleavedBriefingColumns(nextFlat);
        reorderWidgets(left, right);
    };

    if (!editLayout) {
        return (
            <div className={gridClass} data-briefing-widget-grid>
                {flatIds.map((wid, i) => {
                    const w = byId.get(wid);
                    if (!w) return null;
                    const core = renderWidgetCore(wid, w, i, isAdmin);
                    if (!core) return null;
                    return (
                        <div key={wid} className="min-h-[272px] h-full">
                            {injectLayoutMenu(
                                core,
                                hideButtonOnly(wid, layoutLoading, () => updateWidget(wid, { visible: false })),
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <SortableContext id={SORT_GRID} items={flatIds} strategy={rectSortingStrategy}>
                <div className={gridClass} data-briefing-widget-grid>
                    {flatIds.map((wid, i) => {
                        const w = byId.get(wid);
                        if (!w) return null;
                        const core = renderWidgetCore(wid, w, i, isAdmin);
                        if (!core) return null;
                        return (
                            <BriefingGridSortableCell
                                key={wid}
                                id={wid}
                                layoutLoading={layoutLoading}
                                onHide={() => updateWidget(wid, { visible: false })}
                            >
                                {core}
                            </BriefingGridSortableCell>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}
