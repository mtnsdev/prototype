/** Hierarchical location filter — countries grouped by region (Notion ticket). */

export type LocationRegionGroup = { region: string; countries: string[] };

export const LOCATION_GROUPS: LocationRegionGroup[] = [
  {
    region: "Africa",
    countries: ["Kenya", "Morocco", "South Africa", "Tanzania", "Rwanda", "Botswana", "Mozambique", "Madagascar"],
  },
  {
    region: "Asia-Pacific",
    countries: [
      "Indonesia",
      "Japan",
      "Maldives",
      "Thailand",
      "Vietnam",
      "India",
      "Sri Lanka",
      "Cambodia",
      "Bhutan",
      "Philippines",
      "Australia",
      "New Zealand",
      "Fiji",
    ],
  },
  {
    region: "Caribbean",
    countries: [
      "Saint Lucia",
      "Turks & Caicos",
      "Antigua & Barbuda",
      "St. Barts",
      "Jamaica",
      "Bahamas",
      "Barbados",
      "Dominican Republic",
    ],
  },
  {
    region: "Europe",
    countries: [
      "France",
      "Greece",
      "Italy",
      "Monaco",
      "Portugal",
      "Spain",
      "Switzerland",
      "UK",
      "Croatia",
      "Montenegro",
      "Turkey",
      "Norway",
      "Iceland",
    ],
  },
  {
    region: "Middle East",
    countries: ["UAE", "Oman", "Saudi Arabia", "Jordan", "Israel", "Qatar"],
  },
  {
    region: "North America",
    countries: ["USA", "Canada", "Mexico"],
  },
  {
    region: "South America",
    countries: ["Chile", "Argentina", "Brazil", "Peru", "Colombia", "Ecuador"],
  },
  {
    region: "South Pacific",
    countries: ["French Polynesia", "Cook Islands", "Tonga", "Samoa"],
  },
];

const ALL_COUNTRIES = LOCATION_GROUPS.flatMap((g) => g.countries);

export function getCountriesInRegion(region: string): string[] {
  const g = LOCATION_GROUPS.find((x) => x.region === region);
  return g ? [...g.countries] : [];
}

export function isRegionFullySelected(region: string, selectedCountries: string[]): boolean {
  const countries = getCountriesInRegion(region);
  if (countries.length === 0) return false;
  return countries.every((c) => selectedCountries.includes(c));
}

export function toggleRegionSelection(region: string, selectedCountries: string[]): string[] {
  const countries = getCountriesInRegion(region);
  if (countries.length === 0) return selectedCountries;
  if (isRegionFullySelected(region, selectedCountries)) {
    return selectedCountries.filter((c) => !countries.includes(c));
  }
  const set = new Set(selectedCountries);
  countries.forEach((c) => set.add(c));
  return [...set];
}

/** Normalize product country string for filter matching (case-insensitive). */
export function normalizeProductCountry(product: { country?: string; location?: string }): string | null {
  if (product.country?.trim()) return product.country.trim();
  return null;
}

export function productMatchesLocationCountries(
  product: { country?: string; location?: string },
  selectedCountries: string[]
): boolean {
  if (selectedCountries.length === 0) return true;
  const c = normalizeProductCountry(product);
  if (!c) return false;
  const lower = c.toLowerCase();
  return selectedCountries.some((s) => s.toLowerCase() === lower);
}

export function filterLocationGroupsBySearch(
  groups: LocationRegionGroup[],
  q: string
): LocationRegionGroup[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return groups;
  return groups
    .map((g) => ({
      region: g.region,
      countries: g.countries.filter((c) => c.toLowerCase().includes(needle) || g.region.toLowerCase().includes(needle)),
    }))
    .filter((g) => g.countries.length > 0);
}

/** OR match: itinerary is included if any destination line mentions any selected country (substring, case-insensitive). */
export function itineraryMatchesDestinationCountries(
  itineraryDestinations: string[] | undefined,
  selectedCountries: string[]
): boolean {
  if (selectedCountries.length === 0) return true;
  const lines = (itineraryDestinations ?? []).map((d) => d.toLowerCase());
  return selectedCountries.some((country) =>
    lines.some((line) => line.includes(country.toLowerCase()))
  );
}

export { ALL_COUNTRIES };
