import { SPACING_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, TRANSITION_TOKENS } from "@/lib/designSystemTokens";

export function SpacingRamp() {
  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <h3 className="text-[14px] font-medium text-[color:var(--text-primary)]">Spacing</h3>
        <p className="text-[12px] text-[color:var(--text-tertiary)]">
          4px grid, generous rhythm. Use rem-based scales sparingly — these tokens cover most cases.
        </p>
        <div className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4 space-y-2">
          {SPACING_TOKENS.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <code className="w-20 shrink-0 font-mono text-[11px] text-[color:var(--text-tertiary)]">
                --{t.name}
              </code>
              <code className="w-12 shrink-0 font-mono text-[11px] text-[color:var(--text-quaternary)]">
                {t.value}
              </code>
              <div
                className="h-3 rounded-sm bg-[color:var(--brand-primary)]/40"
                style={{ width: t.value === "0" ? "1px" : t.value }}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-[14px] font-medium text-[color:var(--text-primary)]">Radii</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {RADIUS_TOKENS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col items-center gap-2 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-3"
            >
              <div
                className="h-12 w-16 bg-[color:var(--brand-primary)]/15 border border-[color:var(--brand-primary)]/40"
                style={{ borderRadius: t.value }}
                aria-hidden
              />
              <code className="font-mono text-[11px] text-[color:var(--text-tertiary)]">--{t.name}</code>
              <code className="font-mono text-[10px] text-[color:var(--text-quaternary)]">{t.value}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-[14px] font-medium text-[color:var(--text-primary)]">Shadows</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHADOW_TOKENS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col items-center justify-end gap-2 rounded-md bg-[color:var(--surface-card)] p-5"
              style={{ boxShadow: t.value }}
            >
              <code className="font-mono text-[11px] text-[color:var(--text-tertiary)]">
                --{t.name}
              </code>
              {t.caption ? (
                <span className="text-[10px] text-[color:var(--text-quaternary)]">{t.caption}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-[14px] font-medium text-[color:var(--text-primary)]">Transitions</h3>
        <p className="text-[12px] text-[color:var(--text-tertiary)]">
          Hover each box to see the transition.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TRANSITION_TOKENS.map((t) => (
            <div
              key={t.name}
              className="group cursor-pointer rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-5"
              style={{ transition: `background ${t.value}, transform ${t.value}` }}
            >
              <div className="flex flex-col gap-1">
                <code className="font-mono text-[11px] text-[color:var(--text-tertiary)]">
                  --{t.name}
                </code>
                <code className="font-mono text-[11px] text-[color:var(--text-quaternary)]">
                  {t.value}
                </code>
                {t.caption ? (
                  <span className="text-[11px] text-[color:var(--text-quaternary)]">{t.caption}</span>
                ) : null}
              </div>
              <div
                className="mt-2 h-2 origin-left rounded-full bg-[color:var(--brand-primary)] transition-transform group-hover:scale-x-110"
                style={{ transitionTimingFunction: t.value.split(" ")[1] ?? "ease" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
