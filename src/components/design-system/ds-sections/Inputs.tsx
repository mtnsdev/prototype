"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentExample } from "../ComponentExample";

export function Inputs() {
  return (
    <section id="inputs" className="space-y-8 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Inputs &amp; form</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          Mounted from <code className="font-mono text-[12px]">@/components/ui</code>. Includes the
          live primitives the prototype already uses.
        </p>
      </header>

      <ComponentExample
        title="Text input"
        description="Default / placeholder / disabled / value."
        preview={
          <div className="grid w-full max-w-md grid-cols-1 gap-2">
            <Input placeholder="Default placeholder" />
            <Input defaultValue="Aman Tokyo" />
            <Input disabled placeholder="Disabled" />
          </div>
        }
        snippet={`<Input placeholder="Search products..." />`}
      />

      <ComponentExample
        title="With label + helper text"
        preview={
          <div className="w-full max-w-md space-y-1.5">
            <Label htmlFor="ds-product-name">Product name</Label>
            <Input id="ds-product-name" placeholder="e.g. Aman Tokyo" />
            <p className="text-[11px] text-[color:var(--text-quaternary)]">
              The name as it appears in the catalog.
            </p>
          </div>
        }
        snippet={`<Label htmlFor="name">Product name</Label>
<Input id="name" placeholder="e.g. Aman Tokyo" />`}
      />

      <ComponentExample
        title="Search input"
        description="Leading magnifier icon, optional clear button."
        preview={
          <div className="relative w-full max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--chrome-icon-muted)]"
            />
            <Input
              defaultValue="aman"
              placeholder="Search products..."
              className="pl-9 pr-9"
              aria-label="Search products"
            />
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[color:var(--brand-cta)] transition-colors hover:text-[color:var(--brand-cta-hover)]"
            >
              <X size={14} />
            </button>
          </div>
        }
        snippet={`<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 ..." />
  <Input className="pl-9 pr-9" placeholder="Search..." />
</div>`}
      />

      <ComponentExample
        title="Textarea"
        preview={
          <textarea
            rows={3}
            placeholder="A short curation note about this property..."
            className="w-full max-w-md resize-none rounded-md border border-[color:var(--border-default)] bg-[color:var(--surface-card)] px-3 py-2 text-[13px] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-quaternary)] focus:border-[color:var(--brand-cta)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-cta)]/30"
          />
        }
        snippet={`<textarea rows={3} placeholder="..." />`}
      />

      <ComponentExample
        title="Checkbox / radio / toggle"
        description="Lightweight HTML inputs styled with tokens. Replace with shadcn primitives when needed."
        preview={
          <div className="flex flex-col gap-2 text-[13px] text-[color:var(--text-secondary)]">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Daily breakfast
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Late check-out
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="ds-rad" defaultChecked /> Inline
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="ds-rad" /> Modal
              </label>
            </div>
          </div>
        }
      />
    </section>
  );
}
