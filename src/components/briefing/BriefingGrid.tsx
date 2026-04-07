"use client";

import {
    type DragEndEvent,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical } from "lucide-react";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
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

const DROP_LEFT = "briefing-drop-left";
const DROP_RIGHT = "briefing-drop-right";
const SORT_LEFT = "briefing-sort-left";
const SORT_RIGHT = "briefing-sort-right";

const CARD_DENSITY: WidgetCardDensity = "default";

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

function injectLayoutMenu(
    child: ReactElement | null,
    layoutMenu: ReactNode,
): ReactNode {
    if (!child || !isValidElement(child)) return child;
    return cloneElement(child as ReactElement<{ layoutMenu?: ReactNode }>, { layoutMenu });
}

function BriefingGridSortableRow({
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
        <div ref={setNodeRef} style={style} className={cn(isDragging && "z-10 opacity-[0.92]")}>
            {injectLayoutMenu(children, headerActions)}
        </div>
    );
}

function BriefingGridColumnEdit({
    dropId,
    sortableId,
    ids,
    layoutLoading,
    updateWidget,
    isAdmin,
    byId,
    colLabel,
}: {
    dropId: string;
    sortableId: string;
    ids: BriefingUserGridWidgetId[];
    layoutLoading: boolean;
    updateWidget: Props["updateWidget"];
    isAdmin: boolean;
    byId: Map<string, BriefingWidget>;
    colLabel: "Left" | "Right";
}) {
    const { setNodeRef, isOver } = useDroppable({ id: dropId });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex min-h-[100px] flex-col gap-6 rounded-2xl transition-colors",
                isOver && "bg-muted/20 ring-1 ring-border/80",
            )}
            data-briefing-column={colLabel.toLowerCase()}
        >
            <SortableContext id={sortableId} items={ids} strategy={verticalListSortingStrategy}>
                {ids.map((wid, i) => {
                    const w = byId.get(wid);
                    if (!w) return null;
                    const core = renderWidgetCore(wid, w, i, isAdmin);
                    if (!core) return null;
                    return (
                        <BriefingGridSortableRow
                            key={wid}
                            id={wid}
                            layoutLoading={layoutLoading}
                            onHide={() => updateWidget(wid, { visible: false })}
                        >
                            {core}
                        </BriefingGridSortableRow>
                    );
                })}
            </SortableContext>
            {ids.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    Drop widgets here ({colLabel.toLowerCase()} column)
                </p>
            ) : null}
        </div>
    );
}

function BriefingGridColumnStatic({
    ids,
    layoutLoading,
    updateWidget,
    isAdmin,
    byId,
}: {
    ids: BriefingUserGridWidgetId[];
    layoutLoading: boolean;
    updateWidget: Props["updateWidget"];
    isAdmin: boolean;
    byId: Map<string, BriefingWidget>;
}) {
    return (
        <div className="flex flex-col gap-6">
            {ids.map((wid, i) => {
                const w = byId.get(wid);
                if (!w) return null;
                const core = renderWidgetCore(wid, w, i, isAdmin);
                if (!core) return null;
                return (
                    <div key={wid}>
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

function containerForId(
    id: string,
    leftIds: BriefingUserGridWidgetId[],
    rightIds: BriefingUserGridWidgetId[],
): "left" | "right" | undefined {
    if (id === DROP_LEFT) return "left";
    if (id === DROP_RIGHT) return "right";
    if (leftIds.includes(id as BriefingUserGridWidgetId)) return "left";
    if (rightIds.includes(id as BriefingUserGridWidgetId)) return "right";
    return undefined;
}

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

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id) as BriefingUserGridWidgetId;
        if (!BRIEFING_USER_GRID_WIDGET_IDS.includes(activeId)) return;

        const overId = String(over.id);

        const activeContainer = containerForId(activeId, leftIds, rightIds);
        const overContainer = containerForId(overId, leftIds, rightIds);
        if (!activeContainer || !overContainer) return;

        let nextLeft = [...leftIds];
        let nextRight = [...rightIds];

        const getList = (c: "left" | "right") => (c === "left" ? nextLeft : nextRight);
        const setList = (c: "left" | "right", list: BriefingUserGridWidgetId[]) => {
            if (c === "left") nextLeft = list;
            else nextRight = list;
        };

        if (activeContainer === overContainer) {
            const list = getList(activeContainer);
            if (!BRIEFING_USER_GRID_WIDGET_IDS.includes(overId as BriefingUserGridWidgetId)) return;
            const oldIndex = list.indexOf(activeId);
            const newIndex = list.indexOf(overId as BriefingUserGridWidgetId);
            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
            setList(activeContainer, arrayMove(list, oldIndex, newIndex));
        } else {
            const sourceList = [...getList(activeContainer)];
            const destList = [...getList(overContainer)];
            const si = sourceList.indexOf(activeId);
            if (si === -1) return;
            sourceList.splice(si, 1);

            let insertIndex: number;
            if (overId === DROP_LEFT || overId === DROP_RIGHT) {
                insertIndex = destList.length;
            } else if (BRIEFING_USER_GRID_WIDGET_IDS.includes(overId as BriefingUserGridWidgetId)) {
                insertIndex = destList.indexOf(overId as BriefingUserGridWidgetId);
                if (insertIndex === -1) insertIndex = destList.length;
            } else {
                return;
            }

            destList.splice(insertIndex, 0, activeId);
            setList(activeContainer, sourceList);
            setList(overContainer, destList);
        }

        reorderWidgets(nextLeft, nextRight);
    };

    if (!editLayout) {
        return (
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                <BriefingGridColumnStatic
                    ids={leftIds}
                    layoutLoading={layoutLoading}
                    updateWidget={updateWidget}
                    isAdmin={isAdmin}
                    byId={byId}
                />
                <BriefingGridColumnStatic
                    ids={rightIds}
                    layoutLoading={layoutLoading}
                    updateWidget={updateWidget}
                    isAdmin={isAdmin}
                    byId={byId}
                />
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                <BriefingGridColumnEdit
                    dropId={DROP_LEFT}
                    sortableId={SORT_LEFT}
                    ids={leftIds}
                    layoutLoading={layoutLoading}
                    updateWidget={updateWidget}
                    isAdmin={isAdmin}
                    byId={byId}
                    colLabel="Left"
                />
                <BriefingGridColumnEdit
                    dropId={DROP_RIGHT}
                    sortableId={SORT_RIGHT}
                    ids={rightIds}
                    layoutLoading={layoutLoading}
                    updateWidget={updateWidget}
                    isAdmin={isAdmin}
                    byId={byId}
                    colLabel="Right"
                />
            </div>
        </DndContext>
    );
}
