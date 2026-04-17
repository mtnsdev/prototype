# Product directory — prototype scope

This document records what the **Enable prototype** implements today versus what is **explicitly out of scope** (deferred to product / backend work). Use it when prioritizing tickets and avoiding duplicate discovery.

## In scope in the prototype

- **Directory UX**: browse, filter, collections, detail views, mock commissions and partner programs, rep-firm metadata, enrichment signals.
- **Opening signals**: optional `openingDate` / `openingLabel` on directory products; surfaced on cards, list rows, and detail hero via `formatProductOpeningLine`. Admins edit these under **Edit product details (Enable)** on the product detail page; directory search includes opening text, and a **Planned opening** filter narrows to products that display an opening line.
- **Google Places → categories**: `src/data/google-places-type-mapping.json` plus `mapGooglePlaceTypesToEnableCategories()` as a **stub** for ingestion; extend the JSON when new Google `types` appear.
- **Commission display rules**: documented at the top of `src/components/products/productDirectoryCommission.ts` (card “top bookable” behavior vs. filters/registry alignment).
- **Seeds**: expanded mock products, rep firms, and a **consortium program registry** seed so Partner programs can show program coverage before hotels are linked.
- **Catalog persistence (local)**: The browse directory and **product detail** (`/dashboard/products/[id]`) both read and write the same **localStorage** snapshot (`DIRECTORY_CATALOG_LOCAL_STORAGE_KEY` in `productDirectoryPersistence.ts`) via `resolveAdvisorCatalogFromStorage` and `patchPersistedDirectory` in `ProductDirectoryCatalogContext`. Edits survive reload and sync **across browser tabs** when another tab writes the same key — `ProductDirectoryCatalogProvider` listens for the `storage` event and bumps `catalogRevision` so browse/detail reload from storage (the writing tab already has in-memory state).
- **Opening line parity**: Planned opening text appears on **grid cards**, **list rows**, **detail hero**, **map sidebar**, **map cluster tray**, and **map pin popups** (embed/itinerary catalog uses the same `ProductDirectoryPage` / map components as full browse).

## Deferred (out of scope — not implemented in this codebase)

The following remain **documentation / backlog only** — no approval engine, smart collection engine, live commission API, or partner feed integration ships in the prototype.

| Area | Why deferred | Likely next step |
|------|----------------|------------------|
| **Suggestion / approval workflows** for directory changes | Needs roles, persistence, and notifications beyond mock state. | Design workflow + API + audit trail. |
| **Collection ↔ itinerary** deep links | Prototype uses lightweight cross-links; full sync is product-specific. | Define canonical IDs and sync rules with itineraries. |
| **Smart / dynamic collections** | Requires query engine and scheduled refresh. | Spec rule language + indexer. |
| **Full commission pipeline** (contracts, validation, payouts) | Prototype shows **representative** rates and advisories only. | Integrate source-of-truth systems; keep UI rules aligned with `productDirectoryCommission` docs. |
| **Production Google Places ingestion** | Stub mapping only; no live Places API in the prototype. | Server-side Places fetch, caching, and mapping table ownership. |
| **Partner program source of truth** | Registry rows are illustrative until connected to supplier data. | CRM or supplier feed + reconciliation UI. |

## Backlog (ticket placeholders — product / backend work)

Use these labels when filing work; replace `DIR-###` with your tracker’s IDs. None of these epics are implemented in the prototype beyond UI stubs and mocks where noted.

| ID | Epic | Dependencies | Acceptance (high level) |
|----|------|----------------|-------------------------|
| DIR-101 | Directory suggestion & approval | Auth, roles, notifications, audit store | Submitter sees status; approver queue; immutable audit log per change. |
| DIR-102 | Collection ↔ itinerary linking | Itinerary product IDs, API | From a directory product, open linked itineraries; optional sync of collection membership rules. |
| DIR-103 | Smart / dynamic collections | Search/index service, scheduler | User-defined rules; refresh cadence; membership preview before save. |
| DIR-104 | Commission source of truth | Contracts/billing integrations | Registry rates match backend; advisories driven by validated changes only. |
| DIR-105 | Google Places ingestion | Places API, server cache | Import flow maps `types` via `google-places-type-mapping.json`; unmapped types surfaced for admin mapping. |
| DIR-106 | Partner program registry feed | Supplier/CRM APIs | Single source per program; conflict resolution UI; the Partner programs UI reflects feed-backed rows. |

**Prototype stance:** Until these ship, the app continues to use **mock/seed data**, **browser persistence** for demos, and the **display/validation rules** documented in code (e.g. `productDirectoryCommission.ts`, `productDirectoryOpening.ts`) so production can align UI later without rewrites.

## Automated tests (`npm run test:logic`)

Compiles `tsconfig.tests.json` and runs Node’s test runner with `tests/path-register-build.cjs` so `@/` resolves under `.test-build/src`. Covers:

- `productDirectoryOpening` (opening line, search haystack, planned-opening predicate)
- `mergeDirectoryProductPatchInCatalog` (`src/lib/directoryProductMerge.ts`)
- `applyDirectoryProductFilters` (search + planned opening filter)
- Existing partner-programs directory logic and VIC permission helpers

When adding features, prefer extending the **typed models** in `src/types/product-directory.ts` and keeping **display rules** centralized (commission, opening line) so UI stays consistent.
