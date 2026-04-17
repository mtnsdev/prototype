import type { DMCPartner } from "@/data/destinations";
import type { DestinationContactRow } from "@/lib/destinationSectionModel";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatPartnerContactBlock(partner: DMCPartner): { plain: string; html: string } {
  const lines: string[] = [partner.name];
  if (partner.reppedBy) lines.push(partner.reppedBy);
  if (partner.keyContact) lines.push(partner.keyContact);
  if (partner.generalRequests) lines.push(`General: ${partner.generalRequests}`);
  if (partner.afterHours) lines.push(`After hours: ${partner.afterHours}`);
  if (partner.website) lines.push(partner.website);
  const plain = lines.join("\n");
  const html = [
    `<p><strong>${escapeHtml(partner.name)}</strong></p>`,
    ...lines.slice(1).map((l) => `<p>${escapeHtml(l)}</p>`),
  ].join("");
  return { plain, html };
}

export function formatContactRowBlock(c: DestinationContactRow): { plain: string; html: string } {
  const lines: string[] = [c.name];
  if (c.organization) lines.push(c.organization);
  if (c.role) lines.push(c.role);
  if (c.description) lines.push(c.description);
  if (c.email) lines.push(c.email);
  if (c.phone) lines.push(c.phone);
  if (c.website) lines.push(c.website);
  const plain = lines.join("\n");
  const html = `<p><strong>${escapeHtml(c.name)}</strong></p>${lines
    .slice(1)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join("")}`;
  return { plain, html };
}

export async function copyRichTextToClipboard(plain: string, html: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    throw new Error("Clipboard unavailable");
  }
  if (typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plain], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
      return;
    } catch {
      /* Safari / permission — fall back */
    }
  }
  await navigator.clipboard.writeText(plain);
}
