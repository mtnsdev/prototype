# Product directory: tabs vs filters vs sorts

## Rules

1. **Tabs** — Mutually exclusive **workspaces** or **data sources** (different catalogs or ownership scopes). Switching tabs changes which dataset you are browsing. Example: *My Products* vs *Agency Library* vs *Enable Directory*.

2. **Filters** — Narrow the **current** dataset by dimensions (rep firm, category, status, tier, etc.). Rep firms stay a **filter**, not a top-level tab, unless the product team explicitly promotes “rep firm” to a separate catalog with different columns and actions.

3. **Sorts** — Reorder the same result set only. Sorting never replaces tabs or filters.

4. **URL** — Tab and critical filters should be representable in query params for sharing (`?tab=mine`, filters as optional params).

## Current implementation (prototype)

- **Tabs:** `ProductTabBar` — `mine` | `agency` | `enable`.
- **Rep firm:** `ProductDirectoryRepFirmFilterDropdown` in the directory/filter bar (filter, not a tab).

## When to add a rep-firm tab

Only if rep-firm selection implies a different **page job** (e.g. dedicated compliance workspace) rather than a slice of the same grid. Otherwise prefer an always-visible or saved filter preset.
