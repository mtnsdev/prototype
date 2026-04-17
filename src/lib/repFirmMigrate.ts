import type {
  RepFirm,
  RepFirmContactRow,
  RepFirmHeadquarters,
  RepFirmSocialMedia,
  RepFirmSpecialty,
  RepFirmStatus,
} from "@/types/rep-firm";
import { emailsForRepFirmContact, phonesForRepFirmContact } from "@/lib/repFirmContactChannels";

/** Plain text for clipboard (advisor workflow). */
export function repFirmContactToPlainText(
  c: RepFirmContactRow,
  opts?: { firmName?: string }
): string {
  const lines: string[] = [];
  if (opts?.firmName?.trim()) lines.push(`Firm: ${opts.firmName.trim()}`);
  lines.push(c.name.trim());
  if (c.title?.trim()) lines.push(c.title.trim());
  const emails = emailsForRepFirmContact(c);
  const phones = phonesForRepFirmContact(c);
  emails.forEach((e) => lines.push(`Email: ${e}`));
  phones.forEach((p) => lines.push(`Phone: ${p}`));
  return lines.join("\n");
}

function mapLegacyProductType(t: string): RepFirmSpecialty {
  const m: Record<string, RepFirmSpecialty> = {
    hotel: "hotels",
    hotels: "hotels",
    dmc: "dmcs",
    dmcs: "dmcs",
    villa: "villas",
    villas: "villas",
    cruise: "cruise",
    restaurant: "multi",
    experience: "multi",
    wellness: "spas",
    transport: "transportation",
  };
  return m[t.toLowerCase()] ?? "multi";
}

/** Safe https `href` for website / social URLs that may omit the scheme. */
export function normalizeRepFirmUrl(raw: string | undefined | null): string | null {
  const s = raw?.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function normalizeWebsite(raw: string | undefined | null): string | null {
  return normalizeRepFirmUrl(raw);
}

/** Deep-clone a rep firm for React state / persistence. */
export function cloneRepFirmRecord(f: RepFirm): RepFirm {
  return {
    ...f,
    representativeNames: [...f.representativeNames],
    specialty: [...f.specialty],
    regionsCovered: [...f.regionsCovered],
    headquarters: f.headquarters
      ? { ...f.headquarters }
      : null,
    socialMedia: f.socialMedia
      ? { ...f.socialMedia }
      : null,
    contacts: f.contacts.map((c) => ({
      ...c,
      emailAddresses: c.emailAddresses ? [...c.emailAddresses] : undefined,
      phoneNumbers: c.phoneNumbers ? [...c.phoneNumbers] : undefined,
    })),
  };
}

/**
 * Normalize a rep firm loaded from storage or legacy mocks.
 * Strips deprecated fields from the returned object where possible.
 */
export function migrateRepFirmRecord(raw: unknown): RepFirm {
  const r = raw as Partial<RepFirm> & {
    regions?: string[];
    productTypes?: string[];
    website?: string;
  };

  const regionsCovered =
    r.regionsCovered && r.regionsCovered.length > 0
      ? [...r.regionsCovered]
      : r.regions && r.regions.length > 0
        ? [...r.regions]
        : [];

  let specialty: RepFirmSpecialty[] =
    r.specialty && r.specialty.length > 0 ? [...r.specialty] : [];
  if (specialty.length === 0 && r.productTypes && r.productTypes.length > 0) {
    const set = new Set<RepFirmSpecialty>();
    for (const t of r.productTypes) {
      set.add(mapLegacyProductType(t));
    }
    specialty = [...set];
  }
  if (specialty.length === 0) {
    specialty = ["hotels"];
  }

  const websiteUrl = r.websiteUrl != null ? r.websiteUrl : normalizeWebsite(r.website);

  let contacts: RepFirmContactRow[] =
    r.contacts && r.contacts.length > 0
      ? r.contacts.map((c) => ({
          name: c.name,
          title: c.title ?? null,
          email: c.email ?? null,
          phone: c.phone ?? null,
          emailAddresses: c.emailAddresses?.length ? [...c.emailAddresses] : undefined,
          phoneNumbers: c.phoneNumbers?.length ? [...c.phoneNumbers] : undefined,
          photoUrl: c.photoUrl ?? null,
        }))
      : [];

  if (
    contacts.length === 0 &&
    (r.contactName?.trim() || r.contactEmail?.trim() || r.contactPhone?.trim())
  ) {
    contacts = [
      {
        name: r.contactName?.trim() || "Primary contact",
        title: null,
        email: r.contactEmail?.trim() || null,
        phone: r.contactPhone?.trim() || null,
        photoUrl: null,
      },
    ];
  }

  let representativeNames =
    r.representativeNames && r.representativeNames.length > 0
      ? [...r.representativeNames]
      : [];
  if (representativeNames.length === 0 && r.tagline?.trim()) {
    representativeNames = r.tagline
      .split(/[,/&]|(?:\s+—\s+)/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (representativeNames.length === 0 && contacts[0]?.name) {
    representativeNames = [contacts[0].name];
  }
  if (representativeNames.length === 0 && r.name?.trim()) {
    representativeNames = [r.name.trim()];
  }

  const headquarters: RepFirmHeadquarters | null = r.headquarters
    ? {
        city: r.headquarters.city ?? null,
        country: r.headquarters.country ?? null,
        address: r.headquarters.address ?? null,
      }
    : null;

  const socialMedia: RepFirmSocialMedia | null = r.socialMedia
    ? {
        facebook: r.socialMedia.facebook ?? null,
        instagram: r.socialMedia.instagram ?? null,
        linkedin: r.socialMedia.linkedin ?? null,
      }
    : null;

  const status: RepFirmStatus =
    r.status === "active" || r.status === "inactive" || r.status === "prospect" ? r.status : "active";

  const base: RepFirm = {
    id: r.id ?? `rf-${Date.now()}`,
    name: r.name ?? "Unnamed firm",
    tagline: r.tagline,
    description: r.description?.trim() ? r.description.trim() : null,
    representativeNames,
    specialty,
    regionsCovered,
    phone: r.phone?.trim() ? r.phone.trim() : null,
    headquarters,
    websiteUrl: websiteUrl ?? null,
    portalUrl: r.portalUrl?.trim() ? r.portalUrl.trim() : null,
    portalCredentialsNote: r.portalCredentialsNote?.trim() ? r.portalCredentialsNote.trim() : null,
    socialMedia,
    contacts,
    relationshipOwner: r.relationshipOwner?.trim() ? r.relationshipOwner.trim() : null,
    notes: r.notes?.trim() ? r.notes.trim() : null,
    status,
    logoUrl: r.logoUrl,
    propertyCount: r.propertyCount,
    scope: r.scope ?? "enable",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    lastEditedAt: r.lastEditedAt,
    lastEditedById: r.lastEditedById,
    lastEditedByName: r.lastEditedByName,
    luxPagesId: r.luxPagesId ?? null,
    luxPagesLastSynced: r.luxPagesLastSynced ?? null,
    luxPagesLastVerified: r.luxPagesLastVerified ?? null,
    agencyId: r.agencyId,
    createdBy: r.createdBy,
  };

  return base;
}

export function migrateRepFirmList(rows: unknown[]): RepFirm[] {
  return rows.map((x) => migrateRepFirmRecord(x));
}
