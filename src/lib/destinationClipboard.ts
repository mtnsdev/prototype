import type { DMCPartner } from "@/data/destinations";
import type { DestinationContactRow } from "@/lib/destinationSectionModel";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** v1: copy name only; expand to full contact block when integrations land. */
export function formatPartnerContactBlock(partner: DMCPartner): { plain: string; html: string } {
  const plain = partner.name;
  const html = `<p><strong>${escapeHtml(partner.name)}</strong></p>`;
  return { plain, html };
}

export function formatContactRowBlock(c: DestinationContactRow): { plain: string; html: string } {
  const plain = c.name;
  const html = `<p><strong>${escapeHtml(c.name)}</strong></p>`;
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
