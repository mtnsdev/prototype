import type { DestinationAnalyticsEventName } from "@/lib/destinationAnalyticsNames";

/** Pseudonym for logs — not reversible without server salt in production. */
function hashAdvisorHint(raw: string | undefined): string | undefined {
  if (raw == null || raw === "") return undefined;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `u_${(h >>> 0).toString(16).padStart(8, "0")}`;
}

export function logDestinationEvent(
  name: DestinationAnalyticsEventName,
  payload: Record<string, string | number | boolean | undefined>,
  advisorSeed?: string,
): void {
  const line = JSON.stringify({
    event: name,
    ts: new Date().toISOString(),
    advisor: hashAdvisorHint(advisorSeed),
    ...payload,
  });
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.info(`[destination] ${line}`);
  } else {
    // eslint-disable-next-line no-console
    console.info(line);
  }
}
