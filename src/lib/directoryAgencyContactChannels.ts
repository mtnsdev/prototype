import type { DirectoryAgencyContact } from "@/types/product-directory";

/** All email addresses for a contact (prefers `emailAddresses`, falls back to legacy `email`). */
export function emailsForContact(c: DirectoryAgencyContact): string[] {
  if (c.emailAddresses && c.emailAddresses.length > 0) {
    return c.emailAddresses.map((e) => e.trim()).filter(Boolean);
  }
  const e = (c.email ?? "").trim();
  if (e && e !== "—") return [e];
  return [];
}

/** All phone numbers for a contact (prefers `phoneNumbers`, falls back to legacy `phone`). */
export function phonesForContact(c: DirectoryAgencyContact): string[] {
  if (c.phoneNumbers && c.phoneNumbers.length > 0) {
    return c.phoneNumbers.map((p) => p.trim()).filter(Boolean);
  }
  const p = (c.phone ?? "").trim();
  if (p && p !== "—") return [p];
  return [];
}

/** Persist arrays plus legacy first-line fields for older readers. */
export function persistedContactChannels(
  emailInputs: string[],
  phoneInputs: string[]
): Pick<DirectoryAgencyContact, "emailAddresses" | "phoneNumbers" | "email" | "phone"> {
  const emailsList = emailInputs.map((s) => s.trim()).filter(Boolean);
  const phonesList = phoneInputs.map((s) => s.trim()).filter(Boolean);
  return {
    emailAddresses: emailsList.length > 0 ? emailsList : undefined,
    phoneNumbers: phonesList.length > 0 ? phonesList : undefined,
    email: emailsList[0] ?? "—",
    phone: phonesList[0] ?? "—",
  };
}

/** Form default: one empty row for each channel type. */
export function defaultChannelFormRows(): { emails: string[]; phones: string[] } {
  return { emails: [""], phones: [""] };
}
