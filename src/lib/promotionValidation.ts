import type { VolumeMetric } from "@/types/partner-programs";

export type PromotionFormWindowInput = {
  bookingStart: string;
  bookingEnd: string;
  travelStart: string;
  travelEnd: string;
  volumeThreshold: string;
  volumeMetric: VolumeMetric | "";
  scopeAll: boolean;
  selectedProductIds: string[];
  linkedProductIds: string[];
};

function dayOrderMs(a: string, b: string): number | null {
  const ta = Date.parse(`${a}T12:00:00.000Z`);
  const tb = Date.parse(`${b}T12:00:00.000Z`);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  return ta - tb;
}

/** Returns an error message or null when the form is valid. */
export function validatePromotionForm(input: PromotionFormWindowInput): string | null {
  const bs = input.bookingStart.trim();
  const be = input.bookingEnd.trim();
  if (bs && be) {
    const ord = dayOrderMs(bs, be);
    if (ord != null && ord > 0) return "Booking window start must be on or before booking end.";
  }

  const ts = input.travelStart.trim();
  const te = input.travelEnd.trim();
  if (ts && te) {
    const ord = dayOrderMs(ts, te);
    if (ord != null && ord > 0) return "Travel window start must be on or before travel end.";
  }

  if (input.volumeMetric !== "") {
    const raw = input.volumeThreshold.trim();
    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) return "Volume threshold must be a non-negative number.";
    }
  }

  if (!input.scopeAll && input.linkedProductIds.length > 0 && input.selectedProductIds.length === 0) {
    return 'Select at least one linked product, or choose "All products linked to this program".';
  }

  return null;
}
