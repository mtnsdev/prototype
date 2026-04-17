import type {
  Destination,
  DestinationEditorTabId,
  DestinationEditorTabSettings,
  DestinationLegacySectionKey,
  EditorTabContentMode,
  EditorProductSlot,
  EditorTabSection,
  EditorWorkspace,
  EditorWorkspacePersisted,
  EditorWorkspaceTab,
} from "@/data/destinations";
import { DESTINATION_EDITOR_TAB_IDS } from "@/data/destinations";
import { resolveDestinationSectionPresentation } from "@/lib/destinationSectionPresentation";

export type { DestinationEditorTabSettings, EditorTabContentMode };

/** Default copy for each editor nav tab — overridden by `destination.editorTabs?.[id].label`. */
export const EDITOR_TAB_DEFAULT_LABELS: Record<DestinationEditorTabId, string> = {
  overview: "Overview",
  dmc: "DMC partners",
  restaurants: "Restaurants",
  hotels: "Hotels",
  yachts: "Yacht charters",
  tourism: "Tourism",
  documents: "Documents",
};

export function defaultContentModeForTab(tabId: DestinationEditorTabId): EditorTabContentMode {
  if (tabId === "documents") return "documents";
  return "products";
}

/** Legacy `editorTabLabels` from older drafts → `editorTabs[].label`. */
export function mergeLegacyEditorTabLabels(d: Destination): Destination {
  const legacy = d as Destination & {
    editorTabLabels?: Partial<Record<DestinationEditorTabId, string>>;
  };
  if (!legacy.editorTabLabels) return d;
  const editorTabs: NonNullable<Destination["editorTabs"]> = { ...(d.editorTabs ?? {}) };
  for (const id of DESTINATION_EDITOR_TAB_IDS) {
    const lb = legacy.editorTabLabels[id]?.trim();
    if (lb) editorTabs[id] = { ...editorTabs[id], label: lb };
  }
  return { ...d, editorTabs };
}

// ——— Editor workspace (flat guide sections) ———

export function newEditorSectionId(): string {
  return `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * New catalog sections inherit this list until the author picks another in the section card.
 * Tab ids do not imply a catalog bucket — only this default (and explicit `productSlot` on each section).
 */
export const DEFAULT_NEW_SECTION_PRODUCT_SLOT: EditorProductSlot = "dmc";

function tabIdToDefaultSlot(tabId: DestinationEditorTabId): EditorProductSlot | undefined {
  switch (tabId) {
    case "overview":
      return undefined;
    case "dmc":
      return "dmc";
    case "restaurants":
      return "restaurants";
    case "hotels":
      return "hotels";
    case "yachts":
      return "yachts";
    case "tourism":
      return "tourism";
    case "documents":
      return "documents";
    default:
      return undefined;
  }
}

function migrateLegacyTabToSection(
  tabId: DestinationEditorTabId,
  ts: DestinationEditorTabSettings | undefined,
): EditorTabSection {
  const mode: EditorTabContentMode = ts?.contentMode ?? defaultContentModeForTab(tabId);
  const base: EditorTabSection = {
    id: `mig_${tabId}`,
    includeProducts: false,
    includeText: false,
    includeDocuments: false,
    textBody: ts?.textBody,
    documentIndices: ts?.documentIndices,
  };

  if (tabId === "overview") {
    return { ...base, id: "ov-sec" };
  }

  if (tabId === "documents") {
    if (mode === "text") {
      return { ...base, includeText: true };
    }
    if (mode === "documents") {
      return {
        ...base,
        includeDocuments: true,
        productSlot: "documents",
      };
    }
    return {
      ...base,
      includeProducts: true,
      productSlot: "documents",
    };
  }

  if (mode === "text") {
    return { ...base, includeText: true };
  }
  if (mode === "documents") {
    return {
      ...base,
      includeDocuments: true,
      productSlot: tabIdToDefaultSlot(tabId),
    };
  }

  const slot = tabIdToDefaultSlot(tabId);
  return {
    ...base,
    includeProducts: true,
    productSlot: slot ?? "dmc",
  };
}

/** UI id for the Build surface (not stored in workspace — flat `sections` only). */
export const GUIDE_TAB_ID = "guide" as const;

/** Legacy intermediate shape used only to migrate old drafts. */
type LegacyTabsWorkspace = { tabs: EditorWorkspaceTab[] };

/** Default chapter tabs before flattening (one block per legacy bucket). */
function buildExpandedDefaultWorkspace(): LegacyTabsWorkspace {
  const tabs: EditorWorkspaceTab[] = DESTINATION_EDITOR_TAB_IDS.map((tabId) => {
    const label = EDITOR_TAB_DEFAULT_LABELS[tabId];
    if (tabId === "overview") {
      return { id: "overview", label, sections: [] };
    }
    return {
      id: tabId,
      label,
      sections: [migrateLegacyTabToSection(tabId, undefined)],
    };
  });
  return { tabs };
}

/** Collapse legacy `tabs[]` (overview + chapters) into flat {@link EditorWorkspace}. */
function migrateTabsToFlat(ws: LegacyTabsWorkspace): EditorWorkspace {
  const rest = ws.tabs.filter((t) => t.id !== "overview");
  const mergedSections = rest.flatMap((t) => t.sections);
  const guideLabelFromMerged = rest.find((t) => t.id === GUIDE_TAB_ID)?.label?.trim();
  const guideLabelFirst = rest.map((t) => t.label?.trim()).find(Boolean);
  const guideLabel = guideLabelFromMerged || guideLabelFirst || undefined;
  return {
    sections: mergedSections,
    guideLabel,
  };
}

export function ensureEditorWorkspace(destination: Destination): EditorWorkspace {
  const d = mergeLegacyEditorTabLabels(destination);
  const ew: EditorWorkspacePersisted | undefined = d.editorWorkspace;

  if (ew && "sections" in ew && Array.isArray(ew.sections)) {
    return {
      sections: ew.sections.map((s) => ({ ...s })),
      guideLabel: ew.guideLabel?.trim() || undefined,
    };
  }

  if (ew && "tabs" in ew && Array.isArray(ew.tabs) && ew.tabs.length > 0) {
    const tabs = ew.tabs;
    const ws: LegacyTabsWorkspace = tabs.some((t) => t.id === "overview")
      ? { tabs: [...tabs] }
      : {
          tabs: [{ id: "overview", label: EDITOR_TAB_DEFAULT_LABELS.overview, sections: [] }, ...tabs],
        };
    return migrateTabsToFlat(ws);
  }

  const base = buildExpandedDefaultWorkspace();
  if (!d.editorTabs) {
    return migrateTabsToFlat(base);
  }
  const ws: LegacyTabsWorkspace = {
    tabs: base.tabs.map((tab) => {
      const legacyId = tab.id as DestinationEditorTabId;
      if (legacyId === "overview") return tab;
      const ts = d.editorTabs?.[legacyId];
      if (!ts) return tab;
      return {
        ...tab,
        label: ts.label?.trim() || tab.label,
        sections: [migrateLegacyTabToSection(legacyId, ts)],
      };
    }),
  };
  return migrateTabsToFlat(ws);
}

export type EditorSectionPresetId = "catalog" | "text" | "documents" | "catalog_text" | "full";

/**
 * New section from an insert preset. Catalog list (`productSlot`) defaults to {@link DEFAULT_NEW_SECTION_PRODUCT_SLOT}
 * unless you pass `catalogSlot` (tabs never imply a bucket).
 */
export function createEditorSectionFromPreset(
  preset: EditorSectionPresetId,
  catalogSlot: EditorProductSlot = DEFAULT_NEW_SECTION_PRODUCT_SLOT,
): EditorTabSection {
  const id = newEditorSectionId();

  switch (preset) {
    case "catalog":
      return {
        id,
        includeProducts: true,
        includeText: false,
        includeDocuments: false,
        productSlot: catalogSlot,
      };
    case "text":
      return {
        id,
        includeProducts: false,
        includeText: true,
        includeDocuments: false,
      };
    case "documents":
      return {
        id,
        includeProducts: false,
        includeText: false,
        includeDocuments: true,
        productSlot: "documents",
      };
    case "catalog_text":
      return {
        id,
        includeProducts: true,
        includeText: true,
        includeDocuments: false,
        productSlot: catalogSlot,
      };
    case "full":
      return {
        id,
        includeProducts: true,
        includeText: true,
        includeDocuments: true,
        productSlot: catalogSlot,
      };
  }
}

export function defaultEditorSection(): EditorTabSection {
  return createEditorSectionFromPreset("catalog");
}

function isFixedTabId(id: string): id is DestinationEditorTabId {
  return (DESTINATION_EDITOR_TAB_IDS as readonly string[]).includes(id);
}

/** Label for legacy tab ids and the Build surface id {@link GUIDE_TAB_ID}. */
export function resolveWorkspaceTabLabel(destination: Destination | undefined, tabId: string): string {
  const merged = mergeLegacyEditorTabLabels(destination ?? ({} as Destination));
  const ws = ensureEditorWorkspace(merged);
  if (tabId === GUIDE_TAB_ID) {
    if (ws.guideLabel?.trim()) return ws.guideLabel.trim();
    return "Guide";
  }
  if (isFixedTabId(tabId)) {
    const legacy = merged.editorTabs?.[tabId]?.label?.trim();
    if (legacy) return legacy;
    return EDITOR_TAB_DEFAULT_LABELS[tabId];
  }
  return "Tab";
}

export function resolveEditorTabLabel(destination: Destination | undefined, tabId: DestinationEditorTabId): string {
  return resolveWorkspaceTabLabel(destination, tabId);
}

/** Map virtual section / presentation keys → editor tab (for custom titles). */
export const LEGACY_SECTION_TO_EDITOR_TAB: Record<
  Exclude<DestinationLegacySectionKey, "trip-reports">,
  DestinationEditorTabId
> = {
  overview: "overview",
  dmc: "dmc",
  restaurants: "restaurants",
  hotels: "hotels",
  yacht: "yachts",
  tourism: "tourism",
  documents: "documents",
};

export function resolveAdvisorNavTitle(destination: Destination, key: DestinationLegacySectionKey): string {
  if (key === "trip-reports") {
    return resolveDestinationSectionPresentation("trip-reports").title;
  }
  const d = mergeLegacyEditorTabLabels(destination);
  const tabId = LEGACY_SECTION_TO_EDITOR_TAB[key];
  const custom = d.editorTabs?.[tabId]?.label?.trim();
  if (custom) return custom;
  return resolveDestinationSectionPresentation(key).title;
}

export function resolveAdvisorNavIcon(_destination: Destination, key: DestinationLegacySectionKey): string {
  return resolveDestinationSectionPresentation(key).iconKey;
}
