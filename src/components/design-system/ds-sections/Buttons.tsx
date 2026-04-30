"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentExample } from "../ComponentExample";

export function Buttons() {
  return (
    <section id="buttons" className="space-y-8 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Buttons</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          Mounted from <code className="font-mono text-[12px]">@/components/ui/button</code>. The
          variants here are the live ones — change them in source and this page updates.
        </p>
      </header>

      <ComponentExample
        title="Variants"
        description="Six variants. CTA is the primary action color (moss). Default is the muted neutral."
        preview={
          <>
            <Button variant="default">Default</Button>
            <Button variant="cta">CTA</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </>
        }
        snippet={`<Button variant="cta">Save to itinerary</Button>`}
      />

      <ComponentExample
        title="Sizes"
        description="Three sizes. Default is the workhorse."
        preview={
          <>
            <Button size="sm" variant="cta">Small</Button>
            <Button size="default" variant="cta">Default</Button>
            <Button size="lg" variant="cta">Large</Button>
          </>
        }
        snippet={`<Button size="default" variant="cta">Save</Button>`}
      />

      <ComponentExample
        title="With icons"
        description="Lucide icons inherit the button's text color and size."
        preview={
          <>
            <Button variant="cta">
              <Plus />
              Add product
            </Button>
            <Button variant="outline">
              Sort by name
              <ChevronDown />
            </Button>
            <Button variant="destructive">
              <Trash2 />
              Remove
            </Button>
            <Button size="sm" variant="ghost">
              <Plus />
            </Button>
          </>
        }
        snippet={`<Button variant="cta">
  <Plus />
  Add product
</Button>`}
      />

      <ComponentExample
        title="States"
        description="Default, hover, focus, disabled. Hover shows on mouse-over; focus shows when keyboard-tabbed."
        preview={
          <>
            <Button variant="cta">Default</Button>
            <Button variant="cta" disabled>Disabled</Button>
            <Button variant="outline">Default</Button>
            <Button variant="outline" disabled>Disabled</Button>
          </>
        }
        snippet={`<Button variant="cta" disabled>Save</Button>`}
      />
    </section>
  );
}
