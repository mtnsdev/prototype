import { z } from "zod";

const destinationDocumentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["pdf", "docx", "xlsx"]),
  kvDocumentId: z.string().optional(),
});

const tourismLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

const tourismRegionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  links: z.array(tourismLinkSchema),
  contact: z.string().optional(),
});

const yachtCompanySchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  contact: z.string(),
  url: z.string().min(1),
  destinations: z.string(),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

const dmcPartnerSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  preferred: z.boolean(),
  reppedBy: z.string().optional(),
  website: z.string().optional(),
  keyContact: z.string().optional(),
  generalRequests: z.string().optional(),
  pricing: z.string().optional(),
  paymentProcess: z.string().optional(),
  commissionProcess: z.string().optional(),
  afterHours: z.string().optional(),
  notes: z.string().optional(),
  feedback: z.string().optional(),
});

const restaurantSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  url: z.string().optional(),
  note: z.string().optional(),
});

const hotelSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  contact: z.string().optional(),
  repFirm: z.string().optional(),
  url: z.string().optional(),
  note: z.string().optional(),
  properties: z.array(z.string()).optional(),
});

const restaurantMapSchema = z.record(z.string(), z.array(restaurantSchema));
const hotelMapSchema = z.record(z.string(), z.array(hotelSchema));

const editorTabSettingsSchema = z.object({
  label: z.string().optional(),
  contentMode: z.enum(["products", "text", "documents"]).optional(),
  textBody: z.string().optional(),
  documentIndices: z.array(z.number().int().nonnegative()).optional(),
});

const editorTabsSchema = z
  .object({
    overview: editorTabSettingsSchema.optional(),
    dmc: editorTabSettingsSchema.optional(),
    restaurants: editorTabSettingsSchema.optional(),
    hotels: editorTabSettingsSchema.optional(),
    yachts: editorTabSettingsSchema.optional(),
    tourism: editorTabSettingsSchema.optional(),
    documents: editorTabSettingsSchema.optional(),
  })
  .optional();

const editorTabSectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().optional(),
  includeProducts: z.boolean(),
  includeText: z.boolean(),
  includeDocuments: z.boolean(),
  productSlot: z.enum(["dmc", "restaurants", "hotels", "yachts", "tourism", "documents"]).optional(),
  textBody: z.string().optional(),
  documentIndices: z.array(z.number().int().nonnegative()).optional(),
});

function migrateEditorWorkspaceInput(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.sections)) return data;
  if (Array.isArray(o.tabs)) {
    const tabs = o.tabs as Array<{ id: string; label?: string; sections?: unknown[] }>;
    const rest = tabs.filter((t) => t.id !== "overview");
    const mergedSections = rest.flatMap((t) => (Array.isArray(t.sections) ? t.sections : []));
    const guideLabel =
      rest.find((t) => t.id === "guide")?.label?.trim() ||
      rest.map((t) => (typeof t.label === "string" ? t.label.trim() : "")).find(Boolean) ||
      undefined;
    return { sections: mergedSections, guideLabel };
  }
  return data;
}

const editorWorkspaceSchema = z.preprocess(
  migrateEditorWorkspaceInput,
  z
    .object({
      sections: z.array(editorTabSectionSchema),
      guideLabel: z.string().optional(),
    })
    .optional(),
);

/** @deprecated Merged into `editorTabs` on load — kept so old drafts still parse. */
const editorTabLabelsSchema = z
  .object({
    overview: z.string().optional(),
    dmc: z.string().optional(),
    restaurants: z.string().optional(),
    hotels: z.string().optional(),
    yachts: z.string().optional(),
    tourism: z.string().optional(),
    documents: z.string().optional(),
  })
  .optional();

export const destinationEditorSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    tagline: z.string(),
    heroImage: z.string(),
    description: z.string(),
    subRegions: z.array(z.string()),
    dmcPartners: z.array(dmcPartnerSchema),
    restaurants: restaurantMapSchema,
    hotels: hotelMapSchema,
    yachtCompanies: z.array(yachtCompanySchema).optional(),
    tourismRegions: z.array(tourismRegionSchema),
    documents: z.array(destinationDocumentSchema),
    visibleForAgencyIds: z.array(z.string()).optional(),
    editorWorkspace: editorWorkspaceSchema,
    editorTabs: editorTabsSchema,
    editorTabLabels: editorTabLabelsSchema,
  })
  .passthrough();

export type DestinationEditorParsed = z.infer<typeof destinationEditorSchema>;

export function safeParseDestination(data: unknown) {
  return destinationEditorSchema.safeParse(data);
}
