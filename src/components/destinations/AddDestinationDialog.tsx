"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createStubDestination } from "@/data/destinations";
import {
  allocateUniqueDestinationSlug,
  publishDestination,
  registerCustomDestinationSlug,
} from "@/lib/destinationLocalEdits";
import { useToast } from "@/contexts/ToastContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Enter a destination name").max(120),
  tagline: z.string().max(240).optional(),
  description: z.string().max(8000).optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddDestinationDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const slugPreview = useMemo(() => {
    const raw = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return raw || "destination";
  }, [name]);

  const reset = () => {
    setName("");
    setTagline("");
    setDescription("");
    setFieldError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    const parsed = formSchema.safeParse({
      name: name.trim(),
      tagline: tagline.trim() || undefined,
      description: description.trim() || undefined,
    });
    if (!parsed.success) {
      const first = parsed.error.flatten().formErrors[0];
      setFieldError(first ?? "Check your input.");
      return;
    }

    setSubmitting(true);
    try {
      const slug = allocateUniqueDestinationSlug(parsed.data.name);
      const tag =
        parsed.data.tagline?.length ? parsed.data.tagline : "New destination guide.";
      let dest = createStubDestination(slug, parsed.data.name, tag);
      if (parsed.data.description?.length) {
        dest = { ...dest, description: parsed.data.description };
      }
      if (!publishDestination(slug, dest)) {
        toast({
          title: "Could not create destination",
          description: "Validation failed. Try shorter text or different characters.",
          tone: "destructive",
        });
        return;
      }
      registerCustomDestinationSlug(slug);
      toast({ title: "Destination created", description: "Opening the editor…", tone: "success" });
      handleOpenChange(false);
      router.push(`/dashboard/products/destinations/${slug}/edit`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex max-h-[min(90vh,720px)] flex-col">
          <DialogHeader className="border-b border-border/60 bg-background px-6 py-5 text-left">
            <DialogTitle>Add destination</DialogTitle>
            <DialogDescription>
              Name your guide and open the editor. Data is stored in this browser for the prototype.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="dest-name">Destination name</Label>
              <Input
                id="dest-name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="e.g. Sicily"
                autoComplete="off"
                aria-invalid={fieldError != null}
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dest-tagline">Tagline (optional)</Label>
              <Input
                id="dest-tagline"
                value={tagline}
                onChange={(ev) => setTagline(ev.target.value)}
                placeholder="Short line under the title"
                autoComplete="off"
                maxLength={240}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dest-desc">Intro (optional)</Label>
              <textarea
                id="dest-desc"
                value={description}
                onChange={(ev) => setDescription(ev.target.value)}
                placeholder="Opening paragraph for the guide…"
                rows={4}
                maxLength={8000}
                className={cn(
                  "min-h-[96px] w-full resize-y rounded-md border border-input bg-inset px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground/70",
                  "focus-visible:border-[rgba(255,255,255,0.25)] focus-visible:ring-[3px] focus-visible:ring-[rgba(255,255,255,0.1)]"
                )}
              />
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/90">URL key: </span>
              <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground/90">
                {slugPreview}
              </code>
              <span className="mt-1 block">
                If that key is already used, a number suffix is added when you create the guide.
              </span>
            </div>

            {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
          </div>

          <DialogFooter className="border-t border-border/60 bg-background/80 px-6 py-4 backdrop-blur-sm">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="toolbarAccent" disabled={submitting}>
              {submitting ? "Creating…" : "Create & edit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
