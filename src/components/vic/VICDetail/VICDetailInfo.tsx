"use client";

import type { VIC } from "@/types/vic";

type Props = { vic: VIC };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-foreground/[0.04] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">
        {title}
      </h3>
      <div className="text-sm text-[rgba(245,245,245,0.85)] whitespace-pre-wrap">
        {children || "—"}
      </div>
    </div>
  );
}

export default function VICDetailInfo({ vic }: Props) {
  return (
    <div className="space-y-4">
      <Section title="Contact">
        {[vic.phone, vic.email].filter(Boolean).join(" · ") || null}
      </Section>
      {vic.notes && <Section title="Notes">{vic.notes}</Section>}
      {vic.familyContext && <Section title="Family Context">{vic.familyContext}</Section>}
      {vic.preferences && <Section title="Preferences">{vic.preferences}</Section>}
      {vic.loyaltyPrograms && <Section title="Loyalty Programs">{vic.loyaltyPrograms}</Section>}
      {vic.additionalContext && <Section title="Additional Context">{vic.additionalContext}</Section>}
    </div>
  );
}
