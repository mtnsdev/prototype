/**
 * Fetches one free Unsplash hero per destination slug (search query = slug words).
 * Writes src/data/destinationHeroCurated.json. Run after adding destination slugs.
 *
 *   node scripts/build-destination-hero-curated.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEST_TS = path.join(ROOT, "src", "data", "destinations.ts");
const OUT = path.join(ROOT, "src", "data", "destinationHeroCurated.json");

const SUFFIX = "?auto=format&fit=crop&w=1920&h=1080&q=85";

function extractSlugs(ts) {
  const slugs = [];
  const re = /slug:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(ts)) !== null) slugs.push(m[1]);
  const seen = new Set();
  return slugs.filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
}

function searchQueryForSlug(slug) {
  const map = {
    "uk-ireland": "Scotland Ireland landscape",
    "spain-portugal": "Spain travel",
    "jordan-israel": "Petra Jordan",
    "southeast-asia": "Southeast Asia travel",
    "costa-rica": "Costa Rica nature",
    "new-zealand": "New Zealand landscape",
    "uae": "Dubai skyline",
    nordics: "Norway fjord",
    caribbean: "Caribbean beach",
    baltics: "Tallinn Estonia",
    bermuda: "Bermuda beach",
    tahiti: "Bora Bora",
    antarctica: "Antarctica ice",
    arctic: "Arctic northern lights",
    africa: "African safari landscape",
  };
  if (map[slug]) return map[slug];
  return slug.replace(/-/g, " ") + " travel landscape";
}

async function fetchFirstPhoto(query) {
  const u = new URL("https://unsplash.com/napi/search/photos");
  u.searchParams.set("query", query);
  u.searchParams.set("per_page", "15");
  u.searchParams.set("page", "1");
  const res = await fetch(u);
  if (!res.ok) throw new Error(`${res.status} ${query}`);
  const data = await res.json();
  for (const p of data.results ?? []) {
    if (p.premium || p.plus) continue;
    const raw = p.urls?.raw;
    if (!raw) continue;
    return raw.split("?")[0] + SUFFIX;
  }
  return null;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const slugs = extractSlugs(fs.readFileSync(DEST_TS, "utf8"));
  /** @type {Record<string, string>} */
  const out = {};

  for (const slug of slugs) {
    const q = searchQueryForSlug(slug);
    let url = await fetchFirstPhoto(q);
    if (!url) {
      url = await fetchFirstPhoto("travel landscape");
    }
    if (!url) {
      console.error(`No image for ${slug}`);
      process.exit(1);
    }
    out[slug] = url;
    await delay(120);
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT} (${Object.keys(out).length} region-targeted heroes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
