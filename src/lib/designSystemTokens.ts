/**
 * Design system token registry — the single source of truth for the
 * /dashboard/design-system reference page. Mirrors what's in globals.css.
 *
 * Update this file when globals.css changes so the design system page stays
 * in sync. The CSS variable IS the canonical source — this file just makes
 * the values renderable in TS.
 */

export type TokenGroup =
  | "surface"
  | "surface-interactive"
  | "brand"
  | "text"
  | "chrome"
  | "border"
  | "semantic"
  | "muted-state"
  | "spacing"
  | "radius"
  | "shadow"
  | "transition";

export type Token = {
  name: string;            // 'surface-base' (no -- prefix)
  value: string;           // resolved hex/rgba/length
  group: TokenGroup;
  caption?: string;        // human description
  /** For text/border tokens — render preview text/line in this color, on the swatch label area instead of a filled square. */
  previewMode?: "fill" | "text" | "border" | "muted-pair";
  /** For muted-pair, the matching text + border tokens. */
  pairText?: string;
  pairBorder?: string;
  /** For semantic muted variants — the badge label. */
  badgeLabel?: string;
};

/* ────────────────────────────────────────────────────────────
   Surfaces — Paper & Linen
   ──────────────────────────────────────────────────────────── */
export const SURFACE_TOKENS: Token[] = [
  { name: "surface-base", value: "#eceae4", group: "surface", caption: "Page background" },
  { name: "surface-elevated", value: "#f3f1eb", group: "surface", caption: "Slightly raised areas" },
  { name: "surface-card", value: "#f7f6f2", group: "surface", caption: "Cards, active tab pill" },
  { name: "surface-card-hover", value: "#efede6", group: "surface", caption: "Card hover state" },
  { name: "surface-sunken", value: "#e0ddd4", group: "surface", caption: "Inputs, code blocks, map chrome" },
  { name: "surface-overlay", value: "#f7f6f2", group: "surface", caption: "Menus, dropdowns, popovers" },
];

export const SURFACE_INTERACTIVE_TOKENS: Token[] = [
  { name: "surface-interactive", value: "rgba(58, 89, 56, 0.07)", group: "surface-interactive", caption: "Subtle moss-tinted overlay" },
  { name: "surface-interactive-hover", value: "rgba(58, 89, 56, 0.11)", group: "surface-interactive", caption: "Hover state" },
  { name: "surface-interactive-active", value: "rgba(58, 89, 56, 0.15)", group: "surface-interactive", caption: "Active/pressed state" },
];

/* ────────────────────────────────────────────────────────────
   Brand — Moss & Honey
   ──────────────────────────────────────────────────────────── */
export const BRAND_TOKENS: Token[] = [
  { name: "brand-primary", value: "#3a5938", group: "brand", caption: "Active tab text, primary accents" },
  { name: "brand-cta", value: "#517048", group: "brand", caption: "Primary CTA buttons" },
  { name: "brand-cta-hover", value: "#466240", group: "brand", caption: "CTA hover state" },
  { name: "brand-cta-foreground", value: "#f9fbf8", group: "brand", caption: "Text on CTA backgrounds" },
  { name: "brand-chat-user", value: "#6f8b62", group: "brand", caption: "Chat user bubble" },
  { name: "brand-accent", value: "#c4923a", group: "brand", caption: "Honey — stars, highlights, badges" },
];

/* ────────────────────────────────────────────────────────────
   Text — warm ink on paper
   ──────────────────────────────────────────────────────────── */
export const TEXT_TOKENS: Token[] = [
  { name: "text-primary", value: "#171512", group: "text", caption: "Primary content" },
  { name: "text-secondary", value: "#403c36", group: "text", caption: "Body text" },
  { name: "text-tertiary", value: "#524c44", group: "text", caption: "Supporting text, inactive tabs" },
  { name: "text-quaternary", value: "#656058", group: "text", caption: "Captions, placeholders" },
  { name: "text-disabled", value: "#8a8378", group: "text", caption: "Disabled state" },
];

export const CHROME_TOKENS: Token[] = [
  { name: "chrome-label", value: "#4a453d", group: "chrome", caption: "Form labels, eyebrow text" },
  { name: "chrome-icon", value: "#5c564c", group: "chrome", caption: "Default icon stroke" },
  { name: "chrome-icon-muted", value: "#6e675c", group: "chrome", caption: "Tertiary / decorative icons" },
];

/* ────────────────────────────────────────────────────────────
   Borders — soft botanical shadow
   ──────────────────────────────────────────────────────────── */
export const BORDER_TOKENS: Token[] = [
  { name: "border-subtle", value: "rgba(40, 48, 42, 0.09)", group: "border", caption: "Default card edge", previewMode: "border" },
  { name: "border-default", value: "rgba(40, 48, 42, 0.14)", group: "border", caption: "Inputs, hover state", previewMode: "border" },
  { name: "border-strong", value: "rgba(40, 48, 42, 0.22)", group: "border", caption: "Emphasis, focus ring base", previewMode: "border" },
];

/* ────────────────────────────────────────────────────────────
   Semantic — desaturated stone & slate
   ──────────────────────────────────────────────────────────── */
export const SEMANTIC_TOKENS: Token[] = [
  { name: "color-success", value: "#5a6d66", group: "semantic", caption: "Confirmed / synced / verified" },
  { name: "color-warning", value: "#7a6f62", group: "semantic", caption: "Expiring / needs attention" },
  { name: "color-error", value: "#6e5a5e", group: "semantic", caption: "Failed / conflict" },
  { name: "color-info", value: "#5a6f80", group: "semantic", caption: "Neutral notification" },
];

/* ────────────────────────────────────────────────────────────
   Muted state pairs — for badges, pills, inline alerts
   ──────────────────────────────────────────────────────────── */
export const MUTED_STATE_TOKENS: Token[] = [
  {
    name: "muted-success",
    value: "rgba(90, 109, 102, 0.09)",
    group: "muted-state",
    caption: "bg + text + border",
    previewMode: "muted-pair",
    pairText: "#3d4f49",
    pairBorder: "rgba(90, 109, 102, 0.20)",
    badgeLabel: "Active",
  },
  {
    name: "muted-warning",
    value: "rgba(122, 111, 98, 0.09)",
    group: "muted-state",
    caption: "bg + text + border",
    previewMode: "muted-pair",
    pairText: "#5a5246",
    pairBorder: "rgba(122, 111, 98, 0.18)",
    badgeLabel: "Expiring",
  },
  {
    name: "muted-error",
    value: "rgba(110, 90, 94, 0.08)",
    group: "muted-state",
    caption: "bg + text + border",
    previewMode: "muted-pair",
    pairText: "#4a3f42",
    pairBorder: "rgba(110, 90, 94, 0.18)",
    badgeLabel: "Failed",
  },
  {
    name: "muted-info",
    value: "rgba(90, 111, 128, 0.08)",
    group: "muted-state",
    caption: "bg + text + border",
    previewMode: "muted-pair",
    pairText: "#3d4d5c",
    pairBorder: "rgba(90, 111, 128, 0.18)",
    badgeLabel: "Synced",
  },
  {
    name: "muted-accent",
    value: "rgba(105, 98, 115, 0.08)",
    group: "muted-state",
    caption: "Subtle accent",
    previewMode: "muted-pair",
    pairText: "#4a4452",
    pairBorder: "rgba(105, 98, 115, 0.16)",
    badgeLabel: "Featured",
  },
  {
    name: "muted-amber",
    value: "rgba(130, 118, 95, 0.09)",
    group: "muted-state",
    caption: "Honey-adjacent muted",
    previewMode: "muted-pair",
    pairText: "#5e543c",
    pairBorder: "rgba(130, 118, 95, 0.18)",
    badgeLabel: "Pending",
  },
];

/* ────────────────────────────────────────────────────────────
   Spacing scale (4px grid)
   ──────────────────────────────────────────────────────────── */
export const SPACING_TOKENS: Token[] = [
  { name: "space-0", value: "0", group: "spacing" },
  { name: "space-1", value: "4px", group: "spacing" },
  { name: "space-2", value: "8px", group: "spacing" },
  { name: "space-3", value: "12px", group: "spacing" },
  { name: "space-4", value: "20px", group: "spacing" },
  { name: "space-5", value: "24px", group: "spacing" },
  { name: "space-6", value: "28px", group: "spacing" },
  { name: "space-7", value: "36px", group: "spacing" },
  { name: "space-8", value: "52px", group: "spacing" },
  { name: "space-9", value: "72px", group: "spacing" },
];

/* ────────────────────────────────────────────────────────────
   Border radius
   ──────────────────────────────────────────────────────────── */
export const RADIUS_TOKENS: Token[] = [
  { name: "radius-sm", value: "4px", group: "radius", caption: "Tight corners" },
  { name: "radius-md", value: "6px", group: "radius", caption: "Default for buttons" },
  { name: "radius-lg", value: "8px", group: "radius", caption: "Default for cards" },
  { name: "radius-xl", value: "12px", group: "radius", caption: "Large containers" },
  { name: "radius-2xl", value: "16px", group: "radius", caption: "Hero surfaces" },
  { name: "radius-full", value: "9999px", group: "radius", caption: "Pill — advisor button exception" },
];

/* ────────────────────────────────────────────────────────────
   Shadows
   ──────────────────────────────────────────────────────────── */
export const SHADOW_TOKENS: Token[] = [
  { name: "shadow-sm", value: "0 1px 2px rgba(28, 26, 22, 0.06)", group: "shadow", caption: "Subtle lift (CTA)" },
  { name: "shadow-md", value: "0 4px 14px rgba(28, 26, 22, 0.08)", group: "shadow", caption: "Cards, dropdowns" },
  { name: "shadow-lg", value: "0 10px 28px rgba(28, 26, 22, 0.10)", group: "shadow", caption: "Modals" },
  { name: "shadow-xl", value: "0 20px 44px rgba(28, 26, 22, 0.12)", group: "shadow", caption: "Highest elevation" },
];

/* ────────────────────────────────────────────────────────────
   Transitions
   ──────────────────────────────────────────────────────────── */
export const TRANSITION_TOKENS: Token[] = [
  { name: "transition-fast", value: "150ms ease", group: "transition", caption: "Hover, focus" },
  { name: "transition-normal", value: "200ms ease", group: "transition", caption: "Default" },
  { name: "transition-slow", value: "300ms ease", group: "transition", caption: "Sidebar, sheets" },
];

/* ────────────────────────────────────────────────────────────
   Type scale
   ──────────────────────────────────────────────────────────── */
export const TYPE_SCALE = [
  { name: "text-3xl", size: "36px", caption: "Display heading" },
  { name: "text-2xl", size: "28px", caption: "Page title" },
  { name: "text-xl", size: "22px", caption: "Section heading" },
  { name: "text-lg", size: "18px", caption: "Sub-heading" },
  { name: "text-md", size: "16px", caption: "Body large" },
  { name: "text-base", size: "16px", caption: "Body default" },
  { name: "text-sm", size: "13px", caption: "Body small / supporting" },
  { name: "text-xs", size: "12px", caption: "Caption" },
  { name: "text-2xs", size: "11px", caption: "Eyebrow / micro" },
];

export const FONT_FAMILIES = [
  { name: "font-sans", value: "Libre Franklin", caption: "Body, UI, default" },
  { name: "font-display", value: "Fraunces", caption: "Editorial headings only" },
  { name: "font-mono", value: "SF Mono", caption: "Code, hex values" },
];

export const LINE_HEIGHTS = [
  { name: "leading-none", value: "1" },
  { name: "leading-tight", value: "1.22" },
  { name: "leading-snug", value: "1.32" },
  { name: "leading-normal", value: "1.5" },
  { name: "leading-relaxed", value: "1.58" },
];

/**
 * All token groups in display order. Components can iterate over this for
 * grouped rendering.
 */
export const ALL_TOKEN_GROUPS = {
  surfaces: SURFACE_TOKENS,
  surfacesInteractive: SURFACE_INTERACTIVE_TOKENS,
  brand: BRAND_TOKENS,
  text: TEXT_TOKENS,
  chrome: CHROME_TOKENS,
  border: BORDER_TOKENS,
  semantic: SEMANTIC_TOKENS,
  mutedState: MUTED_STATE_TOKENS,
  spacing: SPACING_TOKENS,
  radius: RADIUS_TOKENS,
  shadow: SHADOW_TOKENS,
  transition: TRANSITION_TOKENS,
};
