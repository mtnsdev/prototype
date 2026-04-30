import { TYPE_SCALE, FONT_FAMILIES, LINE_HEIGHTS } from "@/lib/designSystemTokens";

export function TypeScale() {
  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <h3 className="text-[14px] font-medium text-[color:var(--text-primary)]">Font families</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FONT_FAMILIES.map((f) => (
            <div
              key={f.name}
              className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-3"
            >
              <code className="font-mono text-[11px] text-[color:var(--text-tertiary)]">
                --{f.name}
              </code>
              <div
                className="mt-1.5 text-[20px] text-[color:var(--text-primary)]"
                style={{
                  fontFamily:
                    f.name === "font-display"
                      ? "var(--font-display)"
                      : f.name === "font-mono"
                        ? "var(--font-mono)"
                        : "var(--font-sans)",
                }}
              >
                {f.value}
              </div>
              <div className="mt-1 text-[11px] text-[color:var(--text-quaternary)]">{f.caption}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-[14px] font-medium text-[color:var(--text-primary)]">Type scale</h3>
        <p className="text-[12px] text-[color:var(--text-tertiary)]">
          Each row shown at weight 400. Display register (Fraunces) used only for the largest two
          steps — everywhere else is Libre Franklin.
        </p>
        <div className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4 space-y-3">
          {TYPE_SCALE.map((step) => {
            const isDisplay = step.name === "text-3xl" || step.name === "text-2xl";
            return (
              <div key={step.name} className="flex items-baseline gap-4">
                <code className="w-24 shrink-0 font-mono text-[11px] text-[color:var(--text-tertiary)]">
                  --{step.name}
                </code>
                <code className="w-12 shrink-0 font-mono text-[11px] text-[color:var(--text-quaternary)]">
                  {step.size}
                </code>
                <span
                  className="flex-1 text-[color:var(--text-primary)]"
                  style={{
                    fontSize: step.size,
                    fontFamily: isDisplay ? "var(--font-display)" : "var(--font-sans)",
                    lineHeight: 1.2,
                  }}
                >
                  Aman Tokyo
                </span>
                <span className="hidden text-[11px] text-[color:var(--text-quaternary)] sm:inline">
                  {step.caption}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-[14px] font-medium text-[color:var(--text-primary)]">Line heights</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LINE_HEIGHTS.map((lh) => (
            <div
              key={lh.name}
              className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-3"
            >
              <div className="flex items-center gap-2">
                <code className="font-mono text-[11px] text-[color:var(--text-tertiary)]">
                  --{lh.name}
                </code>
                <code className="ml-auto font-mono text-[11px] text-[color:var(--text-quaternary)]">
                  {lh.value}
                </code>
              </div>
              <p
                className="mt-1.5 text-[13px] text-[color:var(--text-secondary)]"
                style={{ lineHeight: lh.value }}
              >
                The lobby opens onto a courtyard of moss-covered stones, where afternoon light
                filters through the bamboo canopy.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
