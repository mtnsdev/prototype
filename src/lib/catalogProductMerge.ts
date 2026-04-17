import type { DirectoryProduct } from "@/types/product-directory";
import type {
  Destination,
  DMCPartner,
  EditorProductSlot,
  Hotel,
  Restaurant,
  YachtCompany,
} from "@/data/destinations";
import { emailsForContact, phonesForContact } from "@/lib/directoryAgencyContactChannels";

function primaryContactLine(product: DirectoryProduct): string | undefined {
  const c = product.agencyContacts[0];
  if (!c) return undefined;
  const emails = emailsForContact(c);
  const phones = phonesForContact(c);
  const parts = [c.name, ...emails, ...phones].filter(Boolean);
  return parts.join(" · ");
}

export function mergeDirectoryProductIntoDmc(partner: DMCPartner, product: DirectoryProduct): DMCPartner {
  return {
    ...partner,
    productId: product.id,
    name: product.name,
    website: product.website ?? partner.website,
    keyContact: primaryContactLine(product) ?? partner.keyContact,
    generalRequests: product.general_requests_email ?? partner.generalRequests,
    pricing: product.pricing_model ?? partner.pricing,
    paymentProcess: product.payment_process ?? partner.paymentProcess,
    commissionProcess: product.commission_process ?? partner.commissionProcess,
    afterHours: product.after_hours_support ?? partner.afterHours,
    reppedBy: product.repped_by ?? partner.reppedBy,
  };
}

export function mergeDirectoryProductIntoRestaurant(row: Restaurant, product: DirectoryProduct): Restaurant {
  return {
    ...row,
    productId: product.id,
    name: product.name,
    url: product.website ?? row.url,
  };
}

export function mergeDirectoryProductIntoHotel(row: Hotel, product: DirectoryProduct): Hotel {
  const link = product.repFirmLinks[0];
  return {
    ...row,
    productId: product.id,
    name: product.name,
    url: product.website ?? row.url,
    contact: primaryContactLine(product) ?? row.contact,
    repFirm: link?.repFirmName ?? row.repFirm,
  };
}

export function mergeDirectoryProductIntoYacht(row: YachtCompany, product: DirectoryProduct): YachtCompany {
  const c = product.agencyContacts[0];
  const contactLine = primaryContactLine(product) ?? row.contact;
  const em = c ? emailsForContact(c) : [];
  const ph = c ? phonesForContact(c) : [];
  return {
    ...row,
    productId: product.id,
    name: product.name,
    url: product.website ?? row.url,
    destinations: product.destinations_served ?? product.destinations ?? row.destinations,
    contact: contactLine,
    contactName: c?.name ?? row.contactName,
    email: em[0] ?? c?.email ?? row.email,
    phone: ph[0] ?? c?.phone ?? row.phone,
  };
}

const FALLBACK_GROUP = "General";

/** Maps a directory product to the destination editor slot used for virtual sections. */
export function inferEditorProductSlot(product: DirectoryProduct): EditorProductSlot {
  const t = product.types;
  if (t.includes("dmc")) return "dmc";
  if (t.includes("restaurant")) return "restaurants";
  if (t.includes("hotel") || t.includes("villa") || t.includes("wellness")) return "hotels";
  if (t.includes("cruise") || t.includes("transport") || t.includes("experience")) return "yachts";
  return "dmc";
}

/**
 * Merges a catalog pick into the correct list on `Destination` and returns which slot to store on the section.
 */
export function applyDirectoryProductToDestination(
  d: Destination,
  product: DirectoryProduct,
): { destination: Destination; slot: EditorProductSlot } {
  const slot = inferEditorProductSlot(product);

  if (slot === "dmc") {
    const next = [...d.dmcPartners];
    const idx = next.findIndex((p) => p.productId === product.id);
    const base: DMCPartner = idx >= 0 ? next[idx]! : { name: product.name, preferred: false };
    const merged = mergeDirectoryProductIntoDmc(base, product);
    if (idx >= 0) next[idx] = merged;
    else next.push(merged);
    return { destination: { ...d, dmcPartners: next }, slot };
  }

  if (slot === "restaurants") {
    const keys = Object.keys(d.restaurants);
    const region = keys[0] ?? FALLBACK_GROUP;
    const list = [...(d.restaurants[region] ?? [])];
    const idx = list.findIndex((r) => r.productId === product.id);
    const base: Restaurant = idx >= 0 ? list[idx]! : { name: product.name };
    const merged = mergeDirectoryProductIntoRestaurant(base, product);
    if (idx >= 0) list[idx] = merged;
    else list.push(merged);
    return {
      destination: { ...d, restaurants: { ...d.restaurants, [region]: list } },
      slot,
    };
  }

  if (slot === "hotels") {
    const keys = Object.keys(d.hotels);
    const group = keys[0] ?? FALLBACK_GROUP;
    const list = [...(d.hotels[group] ?? [])];
    const idx = list.findIndex((h) => h.productId === product.id);
    const base: Hotel = idx >= 0 ? list[idx]! : { name: product.name };
    const merged = mergeDirectoryProductIntoHotel(base, product);
    if (idx >= 0) list[idx] = merged;
    else list.push(merged);
    return {
      destination: { ...d, hotels: { ...d.hotels, [group]: list } },
      slot,
    };
  }

  const yc = d.yachtCompanies ?? [];
  const next = [...yc];
  const idx = next.findIndex((y) => y.productId === product.id);
  const base: YachtCompany =
    idx >= 0
      ? next[idx]!
      : {
          name: product.name,
          contact: "",
          url: product.website ?? "https://example.com",
          destinations: "",
        };
  const merged = mergeDirectoryProductIntoYacht(base, product);
  if (idx >= 0) next[idx] = merged;
  else next.push(merged);
  return { destination: { ...d, yachtCompanies: next }, slot };
}
