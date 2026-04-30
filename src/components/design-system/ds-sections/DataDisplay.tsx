"use client";

import { Star, Users } from "lucide-react";
import { ComponentExample } from "../ComponentExample";

export function DataDisplay() {
  return (
    <section id="data-display" className="space-y-8 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Data display</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          Product rows, document cards, metric tiles, avatar chips. The shapes used in catalog and
          destination views.
        </p>
      </header>

      <ComponentExample
        title="Product row (flat list)"
        description="Per the destination pages spec — same shape regardless of productKind. Colored dot, name, optional pill, optional sub-region tags, optional meta line."
        preview={
          <div className="w-full divide-y divide-[color:var(--border-subtle)] rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
            <ProductRow name="Aman Tokyo" pill="Hotel" tags={["Tokyo"]} meta="Key contact: Akira Sato" dot="#3a5938" />
            <ProductRow name="Sushi Saito" pill="Restaurant · Sushi" tags={["Tokyo", "Michelin"]} meta="Reservations only via Aman" dot="#c4923a" />
            <ProductRow name="Imperial Tour Tokyo" pill="DMC" meta="Multi-day private guides" dot="#5a6f80" />
          </div>
        }
      />

      <ComponentExample
        title="Document card"
        description="File-type colored icon + name + type badge."
        preview={
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <DocumentCard name="Hyatt-Privé-Rate-Sheet.pdf" type="PDF" color="#c87a7a" />
            <DocumentCard name="Aman-Booking-Instructions.docx" type="DOCX" color="#5a6f80" />
            <DocumentCard name="Q4-Commission-Audit.xlsx" type="XLSX" color="#5a6d66" />
          </div>
        }
      />

      <ComponentExample
        title="Metric tile"
        description="Label above, big number below. Use sparingly — only for top-of-page summaries."
        preview={
          <div className="grid w-full gap-3 sm:grid-cols-3">
            <Metric label="Products" value="10,142" delta="+213" />
            <Metric label="Active programs" value="74" delta="+0" />
            <Metric label="Bookings (30d)" value="892" delta="+58" />
          </div>
        }
      />

      <ComponentExample
        title="Avatar / initials chip"
        preview={
          <div className="flex flex-wrap items-center gap-3">
            <Avatar initials="MR" />
            <Avatar initials="PP" />
            <Avatar initials="JM" />
            <Avatar initials="CC" />
            <div className="inline-flex items-center gap-1.5 text-[12px] text-[color:var(--text-tertiary)]">
              <Users size={14} className="text-[color:var(--chrome-icon-muted)]" /> 12 advisors
            </div>
          </div>
        }
      />
    </section>
  );
}

function ProductRow({ name, pill, tags, meta, dot }: { name: string; pill?: string; tags?: string[]; meta?: string; dot: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="size-2 shrink-0 rounded-full" style={{ background: dot }} aria-hidden />
      <span className="text-[13px] font-medium text-[color:var(--text-primary)]">{name}</span>
      {pill ? (
        <span className="rounded-md bg-[color:var(--surface-interactive)] px-1.5 py-0.5 text-[11px] text-[color:var(--brand-primary)]">
          {pill}
        </span>
      ) : null}
      {tags?.map((t) => (
        <span key={t} className="rounded bg-[color:var(--surface-card-hover)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--text-tertiary)]">
          {t}
        </span>
      ))}
      <span className="ml-auto flex items-center gap-1 text-[11px] text-[color:var(--brand-accent)]">
        <Star size={12} fill="currentColor" /> 5
      </span>
      {meta ? <span className="ml-3 text-[11px] text-[color:var(--text-tertiary)]">{meta}</span> : null}
    </div>
  );
}

function DocumentCard({ name, type, color }: { name: string; type: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded text-[10px] font-bold uppercase text-white"
        style={{ background: color }}
      >
        {type.slice(0, 3)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-[color:var(--text-primary)]">{name}</div>
        <div className="text-[11px] text-[color:var(--text-quaternary)]">{type}</div>
      </div>
    </div>
  );
}

function Metric({ label, value, delta }: { label: string; value: string; delta: string }) {
  const positive = delta.startsWith("+");
  return (
    <div className="rounded-md bg-[color:var(--surface-elevated)] p-3">
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--chrome-label)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[24px] font-medium text-[color:var(--text-primary)]">{value}</span>
        <span
          className="text-[11px]"
          style={{
            color: positive ? "var(--muted-success-text)" : "var(--text-quaternary)",
          }}
        >
          {delta} this week
        </span>
      </div>
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-[color:var(--surface-interactive)] text-[11px] font-medium text-[color:var(--brand-primary)]">
      {initials}
    </div>
  );
}
