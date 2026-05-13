/**
 * Prototype Places search stub.
 *
 * Real flow (eventually): forward `query` to the Google Places Text Search
 * API server-side, normalize the response, return the top N results.
 *
 * Prototype: returns a fixed mock dataset, optionally narrowed by a
 * case-insensitive substring match on `name` / `formatted_address`. Network
 * delay is simulated so the UI can show a real loading state.
 */

import { NextResponse } from "next/server";
import { MOCK_PLACES, type MockPlaceResult } from "@/data/mockGooglePlaces";

const SIMULATED_LATENCY_MS = 600;
const MAX_RESULTS = 15;

function matches(place: MockPlaceResult, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    place.name.toLowerCase().includes(q) ||
    place.formatted_address.toLowerCase().includes(q) ||
    place.city.toLowerCase().includes(q) ||
    place.country.toLowerCase().includes(q)
  );
}

export async function POST(req: Request) {
  let query = "";
  try {
    const body = (await req.json()) as { query?: unknown };
    if (typeof body.query === "string") query = body.query.trim();
  } catch {
    // Empty body is fine — falls through to the full mock list.
  }

  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));

  const filtered = MOCK_PLACES.filter((p) => matches(p, query));
  // If the query has no hits we still return the fixed set so the demo
  // never looks broken. Clearly fake by design — see the data file.
  const results = (filtered.length > 0 ? filtered : MOCK_PLACES).slice(0, MAX_RESULTS);

  return NextResponse.json({
    results,
    is_mocked: true,
    /** Marker so we can swap to live Places later without touching callers. */
    source: "prototype-mock",
  });
}
