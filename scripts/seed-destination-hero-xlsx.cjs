/**
 * Builds scripts/data/Destination_Hero_Images.xlsx from slugs in src/data/destinations.ts.
 * Hero URLs default to src/data/destinationHeroCurated.json (editorial / Unsplash).
 * Replace cells with your CDN URLs, then run `npm run import:hero-images`.
 */

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const DESTINATIONS_TS = path.join(__dirname, "..", "src", "data", "destinations.ts");
const CURATED = path.join(__dirname, "..", "src", "data", "destinationHeroCurated.json");
const OUT = path.join(__dirname, "data", "Destination_Hero_Images.xlsx");

function picsum(slug) {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/1600/720`;
}

function extractSlugs(ts) {
  const slugs = [];
  const re = /slug:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(ts)) !== null) {
    slugs.push(m[1]);
  }
  const seen = new Set();
  const unique = [];
  for (const s of slugs) {
    if (!seen.has(s)) {
      seen.add(s);
      unique.push(s);
    }
  }
  return unique;
}

function main() {
  const text = fs.readFileSync(DESTINATIONS_TS, "utf8");
  const slugs = extractSlugs(text);
  let curated = {};
  if (fs.existsSync(CURATED)) {
    curated = JSON.parse(fs.readFileSync(CURATED, "utf8"));
  }
  const rows = [
    ["slug", "hero_url"],
    ...slugs.map((slug) => [slug, curated[slug]?.trim() || picsum(slug)]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hero images");
  XLSX.writeFile(wb, OUT);
  console.log(`Wrote ${OUT} (${slugs.length} rows)`);
}

main();
