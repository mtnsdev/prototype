import {
  SURFACE_TOKENS,
  SURFACE_INTERACTIVE_TOKENS,
  BRAND_TOKENS,
  TEXT_TOKENS,
  CHROME_TOKENS,
  BORDER_TOKENS,
  SEMANTIC_TOKENS,
  MUTED_STATE_TOKENS,
} from "@/lib/designSystemTokens";
import { TokenGrid } from "../TokenGrid";
import { TypeScale } from "../TypeScale";
import { SpacingRamp } from "../SpacingRamp";

export function Foundations() {
  return (
    <section id="foundations" className="space-y-10 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Foundations</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          The atoms. Every CSS variable from <code className="font-mono text-[12px]">globals.css</code>.
          Click any swatch to copy <code className="font-mono text-[12px]">var(--token)</code> to your clipboard.
        </p>
      </header>

      <TokenGrid
        title="Surfaces — Paper & Linen"
        description="Six warm cream surfaces, layered from page background to elevated overlay."
        tokens={SURFACE_TOKENS}
      />

      <TokenGrid
        title="Surface interactive (moss-tinted overlays)"
        description="Subtle moss tint on top of any surface. Used for hover, active, and selected states."
        tokens={SURFACE_INTERACTIVE_TOKENS}
      />

      <TokenGrid
        title="Brand — Moss & Honey"
        description="Six brand tokens. Moss for primary accents and CTAs, honey for highlights."
        tokens={BRAND_TOKENS}
      />

      <TokenGrid
        title="Text — Warm ink on paper"
        description="Five ink tones, tuned for AA contrast on the surfaces above."
        tokens={TEXT_TOKENS}
      />

      <TokenGrid
        title="Chrome (labels, icons)"
        description="Used for form labels and icon strokes — subtly warmer than text tokens."
        tokens={CHROME_TOKENS}
      />

      <TokenGrid
        title="Borders — Soft botanical shadow"
        description="Three weights, all with botanical undertone."
        tokens={BORDER_TOKENS}
      />

      <TokenGrid
        title="Semantic — Stone & Slate"
        description="Desaturated on purpose. No traffic-light gamut."
        tokens={SEMANTIC_TOKENS}
        columns={4}
      />

      <TokenGrid
        title="Muted state pairs"
        description="For badges, pills, inline alerts. Each row pairs a soft background, a deep text tone, and a low-opacity border."
        tokens={MUTED_STATE_TOKENS}
      />

      <TypeScale />

      <SpacingRamp />
    </section>
  );
}
