import { z } from "zod";
import type { RepFirmSpecialty } from "@/types/rep-firm";
import { REP_FIRM_SPECIALTIES } from "@/lib/repFirmConstants";

const specialtyEnum = z.enum([...REP_FIRM_SPECIALTIES] as [RepFirmSpecialty, ...RepFirmSpecialty[]]);

export const repFirmContactSchema = z.object({
  name: z.string().min(1),
  title: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  emailAddresses: z.array(z.string()).optional(),
  phoneNumbers: z.array(z.string()).optional(),
  photoUrl: z.string().nullable(),
});

export const repFirmPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    representativeNames: z.array(z.string()).optional(),
    specialty: z.array(specialtyEnum).optional(),
    regionsCovered: z.array(z.string()).optional(),
    phone: z.string().nullable().optional(),
    headquarters: z
      .object({
        city: z.string().nullable(),
        country: z.string().nullable(),
        address: z.string().nullable(),
      })
      .nullable()
      .optional(),
    websiteUrl: z.string().nullable().optional(),
    portalUrl: z.string().nullable().optional(),
    portalCredentialsNote: z.string().nullable().optional(),
    socialMedia: z
      .object({
        facebook: z.string().nullable(),
        instagram: z.string().nullable(),
        linkedin: z.string().nullable(),
      })
      .nullable()
      .optional(),
    contacts: z.array(repFirmContactSchema).optional(),
    relationshipOwner: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(["active", "inactive", "prospect"]).optional(),
    logoUrl: z.string().optional(),
    propertyCount: z.number().optional(),
    scope: z.string().optional(),
    tagline: z.string().optional(),
    description: z.string().nullable().optional(),
    luxPagesId: z.string().nullable().optional(),
    luxPagesLastSynced: z.string().nullable().optional(),
    luxPagesLastVerified: z.string().nullable().optional(),
    updatedAt: z.string().optional(),
    lastEditedAt: z.string().optional(),
    lastEditedById: z.string().optional(),
    lastEditedByName: z.string().optional(),
  });

export type RepFirmPatchInput = z.infer<typeof repFirmPatchSchema>;
