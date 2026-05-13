/**
 * Prototype Places photo stub — mirrors the future production flow:
 *
 *   1. Look up the placeId in our image cache table (in-memory map here).
 *   2. If cached, return the cached URL (would point at our S3 bucket).
 *   3. If not cached, fetch the *official* photo from Google Places, persist
 *      to S3, write the row to the cache table, then return the new URL.
 *
 * The prototype skips steps 2/3's I/O and just returns the hard-coded
 * `photo_url` from the mock dataset. The cache map still records the lookup
 * so the second call for the same placeId reports a cache hit (useful for
 * verifying the cache wiring during demos).
 */

import { NextResponse } from "next/server";
import { MOCK_PLACES } from "@/data/mockGooglePlaces";

const photoCache = new Map<string, string>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeId = url.searchParams.get("placeId")?.trim();
  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const cached = photoCache.get(placeId);
  if (cached) {
    return NextResponse.json({
      url: cached,
      cache_hit: true,
      source: "prototype-mock-cache",
    });
  }

  const place = MOCK_PLACES.find((p) => p.place_id === placeId);
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  // Simulate the S3 upload + cache write that would happen server-side
  // after a successful Places photo fetch.
  photoCache.set(placeId, place.photo_url);

  return NextResponse.json({
    url: place.photo_url,
    cache_hit: false,
    source: "prototype-mock-fetch",
  });
}
