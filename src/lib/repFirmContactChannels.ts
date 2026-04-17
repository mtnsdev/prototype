import type { RepFirmContactRow, RepFirmProductLink } from "@/types/rep-firm";

/** All emails for a rep firm contact row (prefers `emailAddresses`, falls back to `email`). */
export function emailsForRepFirmContact(c: RepFirmContactRow): string[] {
  if (c.emailAddresses && c.emailAddresses.length > 0) {
    return c.emailAddresses.map((e) => e.trim()).filter(Boolean);
  }
  const e = (c.email ?? "").trim();
  return e ? [e] : [];
}

/** All phone numbers for a rep firm contact row (prefers `phoneNumbers`, falls back to `phone`). */
export function phonesForRepFirmContact(c: RepFirmContactRow): string[] {
  if (c.phoneNumbers && c.phoneNumbers.length > 0) {
    return c.phoneNumbers.map((p) => p.trim()).filter(Boolean);
  }
  const p = (c.phone ?? "").trim();
  return p ? [p] : [];
}

/** Persist arrays plus legacy first-line fields for older readers. */
export function persistedRepFirmContactRow(
  emailInputs: string[],
  phoneInputs: string[]
): Pick<RepFirmContactRow, "emailAddresses" | "phoneNumbers" | "email" | "phone"> {
  const emailsList = emailInputs.map((s) => s.trim()).filter(Boolean);
  const phonesList = phoneInputs.map((s) => s.trim()).filter(Boolean);
  return {
    emailAddresses: emailsList.length > 0 ? emailsList : undefined,
    phoneNumbers: phonesList.length > 0 ? phonesList : undefined,
    email: emailsList[0] ?? null,
    phone: phonesList[0] ?? null,
  };
}

export function defaultRepFirmChannelFormRows(): { emails: string[]; phones: string[] } {
  return { emails: [""], phones: [""] };
}

/** Build per-product link contact fields from editable rows (legacy first-line + arrays). */
export function persistedPerProductRepLinkContacts(args: {
  contactName: string;
  emailRows: string[];
  phoneRows: string[];
  notes: string;
  market: string;
}): Pick<
  RepFirmProductLink,
  "contactName" | "contactEmail" | "contactPhone" | "contactEmails" | "contactPhones" | "notes" | "market"
> {
  const em = args.emailRows.map((s) => s.trim()).filter(Boolean);
  const ph = args.phoneRows.map((s) => s.trim()).filter(Boolean);
  return {
    contactName: args.contactName.trim() || undefined,
    contactEmail: em[0] ?? undefined,
    contactPhone: ph[0] ?? undefined,
    contactEmails: em.length > 0 ? em : undefined,
    contactPhones: ph.length > 0 ? ph : undefined,
    notes: args.notes.trim() || undefined,
    market: args.market.trim() ? args.market.trim() : null,
  };
}
