import { z } from "zod";

const destinationDocumentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["pdf", "docx", "xlsx"]),
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

export const destinationEditorSchema = z.object({
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
});

export type DestinationEditorParsed = z.infer<typeof destinationEditorSchema>;

export function safeParseDestination(data: unknown) {
  return destinationEditorSchema.safeParse(data);
}
