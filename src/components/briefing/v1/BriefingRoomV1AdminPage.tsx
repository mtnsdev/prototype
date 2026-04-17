"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, Plus, Trash2 } from "lucide-react";
import { useBriefingRoomV1 } from "@/hooks/useBriefingRoomV1";
import { useUser } from "@/contexts/UserContext";
import { BRIEFING_ROOM_PATH } from "@/lib/briefingRoutes";
import {
  type AnnouncementPriority,
  type BriefingV1Announcement,
  type BriefingV1Commission,
  type BriefingV1Featured,
  type BriefingV1KvHighlight,
  type BriefingV1State,
  type CommissionCategory,
  type FeaturedType,
  type KvHighlightCategory,
  defaultBriefingV1State,
} from "@/lib/briefingRoomV1Store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function newId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}`;
}

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[j]] = [next[j]!, next[index]!];
  return next;
}

export default function BriefingRoomV1AdminPage() {
  const { prototypeAdminView } = useUser();
  const { state, setState } = useBriefingRoomV1();

  const [annOpen, setAnnOpen] = useState(false);
  const [annDraft, setAnnDraft] = useState<BriefingV1Announcement | null>(null);

  const [comOpen, setComOpen] = useState(false);
  const [comDraft, setComDraft] = useState<BriefingV1Commission | null>(null);

  const [featOpen, setFeatOpen] = useState(false);
  const [featDraft, setFeatDraft] = useState<BriefingV1Featured | null>(null);

  const [kvOpen, setKvOpen] = useState(false);
  const [kvDraft, setKvDraft] = useState<BriefingV1KvHighlight | null>(null);

  const patch = useCallback((fn: (s: BriefingV1State) => BriefingV1State) => {
    setState((s) => fn(s));
  }, [setState]);

  const resetDemo = useCallback(() => {
    setState(defaultBriefingV1State());
  }, [setState]);

  const annList = useMemo(() => state.announcements, [state.announcements]);

  if (!prototypeAdminView) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Briefing Room CMS</CardTitle>
          <CardDescription>
            Switch to <span className="font-medium text-foreground/90">Admin view</span> in the sidebar menu to
            manage Briefing Room content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={BRIEFING_ROOM_PATH}>Back to Briefing Room</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Briefing Room</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish announcements, incentives, featured links, and Knowledge Vault highlights. Advisors see updates on{" "}
            <Link href={BRIEFING_ROOM_PATH} className="font-medium text-[var(--color-info)] hover:underline">
              {BRIEFING_ROOM_PATH}
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={BRIEFING_ROOM_PATH}>
              <Eye className="mr-2 size-4" />
              Preview as advisor
            </Link>
          </Button>
          <Button type="button" variant="secondary" onClick={resetDemo}>
            Reset demo content
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Team notices — priority, pin, optional expiry.</CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setAnnDraft({
                id: newId("ann"),
                title: "",
                body: "",
                priority: "info",
                pinned: false,
                published: true,
                expiresAt: null,
                createdAt: new Date().toISOString(),
              });
              setAnnOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {annList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            annList.map((a, i) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.title || "(untitled)"}</p>
                  <p className="text-xs text-muted-foreground">{a.published ? "Published" : "Draft"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Move up"
                    onClick={() => patch((s) => ({ ...s, announcements: move(s.announcements, i, -1) }))}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Move down"
                    onClick={() => patch((s) => ({ ...s, announcements: move(s.announcements, i, 1) }))}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAnnDraft(a);
                      setAnnOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-[var(--color-error)]"
                    aria-label="Delete"
                    onClick={() =>
                      patch((s) => ({ ...s, announcements: s.announcements.filter((x) => x.id !== a.id) }))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CommissionAdminSection
        items={state.commissions}
        patch={patch}
        onAdd={() => {
          const t = new Date();
          const from = t.toISOString().slice(0, 10);
          const until = new Date(t.getTime() + 86400000 * 30).toISOString().slice(0, 10);
          setComDraft({
            id: newId("com"),
            title: "",
            description: "",
            partnerName: "",
            commissionLabel: "",
            validFrom: from,
            validUntil: until,
            category: "hotel",
            region: "",
            link: "",
            published: true,
          });
          setComOpen(true);
        }}
        onEdit={(c) => {
          setComDraft(c);
          setComOpen(true);
        }}
      />

      <FeaturedAdminSection
        items={state.featured}
        patch={patch}
        onAdd={() => {
          setFeatDraft({
            id: newId("feat"),
            title: "",
            description: "",
            typeTag: "article",
            href: BRIEFING_ROOM_PATH,
            published: true,
          });
          setFeatOpen(true);
        }}
        onEdit={(f) => {
          setFeatDraft(f);
          setFeatOpen(true);
        }}
      />

      <KvAdminSection
        items={state.kvHighlights}
        patch={patch}
        onAdd={() => {
          setKvDraft({
            id: newId("kv"),
            title: "",
            description: "",
            documentHref: "/dashboard/knowledge-vault",
            category: "program update",
            published: true,
            isNew: false,
          });
          setKvOpen(true);
        }}
        onEdit={(k) => {
          setKvDraft(k);
          setKvOpen(true);
        }}
      />

      <AnnouncementDialog
        open={annOpen}
        onOpenChange={setAnnOpen}
        draft={annDraft}
        isEdit={annDraft != null && annList.some((a) => a.id === annDraft.id)}
        onSave={(next) => {
          patch((s) => {
            const exists = s.announcements.some((x) => x.id === next.id);
            return {
              ...s,
              announcements: exists
                ? s.announcements.map((x) => (x.id === next.id ? next : x))
                : [...s.announcements, next],
            };
          });
          setAnnOpen(false);
        }}
      />

      <CommissionDialog
        open={comOpen}
        onOpenChange={setComOpen}
        draft={comDraft}
        onSave={(next) => {
          patch((s) => {
            const exists = s.commissions.some((x) => x.id === next.id);
            return {
              ...s,
              commissions: exists
                ? s.commissions.map((x) => (x.id === next.id ? next : x))
                : [...s.commissions, next],
            };
          });
          setComOpen(false);
        }}
      />

      <FeaturedDialog
        open={featOpen}
        onOpenChange={setFeatOpen}
        draft={featDraft}
        onSave={(next) => {
          patch((s) => {
            const exists = s.featured.some((x) => x.id === next.id);
            return {
              ...s,
              featured: exists ? s.featured.map((x) => (x.id === next.id ? next : x)) : [...s.featured, next],
            };
          });
          setFeatOpen(false);
        }}
      />

      <KvDialog
        open={kvOpen}
        onOpenChange={setKvOpen}
        draft={kvDraft}
        onSave={(next) => {
          patch((s) => {
            const exists = s.kvHighlights.some((x) => x.id === next.id);
            return {
              ...s,
              kvHighlights: exists
                ? s.kvHighlights.map((x) => (x.id === next.id ? next : x))
                : [...s.kvHighlights, next],
            };
          });
          setKvOpen(false);
        }}
      />
    </div>
  );
}

function CommissionAdminSection({
  items,
  patch,
  onAdd,
  onEdit,
}: {
  items: BriefingV1Commission[];
  patch: (fn: (s: BriefingV1State) => BriefingV1State) => void;
  onAdd: () => void;
  onEdit: (c: BriefingV1Commission) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Commission opportunities</CardTitle>
          <CardDescription>Valid from / until — expired windows hide automatically for advisors.</CardDescription>
        </div>
        <Button type="button" size="sm" onClick={onAdd}>
          <Plus className="mr-1 size-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No commission posts.</p>
        ) : (
          items.map((c, i) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{c.title || "(untitled)"}</p>
                <p className="text-xs text-muted-foreground">
                  {c.validFrom} → {c.validUntil}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Move up"
                  onClick={() => patch((s) => ({ ...s, commissions: move(s.commissions, i, -1) }))}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Move down"
                  onClick={() => patch((s) => ({ ...s, commissions: move(s.commissions, i, 1) }))}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onEdit(c)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-[var(--color-error)]"
                  aria-label="Delete"
                  onClick={() =>
                    patch((s) => ({ ...s, commissions: s.commissions.filter((x) => x.id !== c.id) }))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function FeaturedAdminSection({
  items,
  patch,
  onAdd,
  onEdit,
}: {
  items: BriefingV1Featured[];
  patch: (fn: (s: BriefingV1State) => BriefingV1State) => void;
  onAdd: () => void;
  onEdit: (f: BriefingV1Featured) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Featured content</CardTitle>
          <CardDescription>Editor&apos;s picks — internal routes or external URLs.</CardDescription>
        </div>
        <Button type="button" size="sm" onClick={onAdd}>
          <Plus className="mr-1 size-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No featured items.</p>
        ) : (
          items.map((f, i) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{f.title || "(untitled)"}</p>
                <p className="truncate text-xs text-muted-foreground">{f.href}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Move up"
                  onClick={() => patch((s) => ({ ...s, featured: move(s.featured, i, -1) }))}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Move down"
                  onClick={() => patch((s) => ({ ...s, featured: move(s.featured, i, 1) }))}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onEdit(f)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-[var(--color-error)]"
                  aria-label="Delete"
                  onClick={() => patch((s) => ({ ...s, featured: s.featured.filter((x) => x.id !== f.id) }))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function KvAdminSection({
  items,
  patch,
  onAdd,
  onEdit,
}: {
  items: BriefingV1KvHighlight[];
  patch: (fn: (s: BriefingV1State) => BriefingV1State) => void;
  onAdd: () => void;
  onEdit: (k: BriefingV1KvHighlight) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Knowledge Vault highlights</CardTitle>
          <CardDescription>Point advisors to documents inside Enable.</CardDescription>
        </div>
        <Button type="button" size="sm" onClick={onAdd}>
          <Plus className="mr-1 size-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No highlights.</p>
        ) : (
          items.map((k, i) => (
            <div
              key={k.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{k.title || "(untitled)"}</p>
                <p className="truncate text-xs text-muted-foreground">{k.documentHref}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Move up"
                  onClick={() => patch((s) => ({ ...s, kvHighlights: move(s.kvHighlights, i, -1) }))}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Move down"
                  onClick={() => patch((s) => ({ ...s, kvHighlights: move(s.kvHighlights, i, 1) }))}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onEdit(k)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-[var(--color-error)]"
                  aria-label="Delete"
                  onClick={() =>
                    patch((s) => ({ ...s, kvHighlights: s.kvHighlights.filter((x) => x.id !== k.id) }))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

const CHECKBOX_CLASS =
  "size-4 shrink-0 rounded border border-input bg-background text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function AnnouncementDialog({
  open,
  onOpenChange,
  draft,
  isEdit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: BriefingV1Announcement | null;
  isEdit: boolean;
  onSave: (a: BriefingV1Announcement) => void;
}) {
  const [local, setLocal] = useState<BriefingV1Announcement | null>(null);
  useEffect(() => {
    if (open && draft) setLocal({ ...draft });
    if (!open) setLocal(null);
  }, [open, draft]);

  if (!local) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-background border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              value={local.title}
              onChange={(e) => setLocal({ ...local, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Body</Label>
            <textarea
              id="ann-body"
              className={cn(
                "min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              value={local.body}
              onChange={(e) => setLocal({ ...local, body: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={local.priority}
              onValueChange={(v) => setLocal({ ...local, priority: v as AnnouncementPriority })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                checked={local.pinned}
                onChange={(e) => setLocal({ ...local, pinned: e.target.checked })}
              />
              Pinned
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                checked={local.published}
                onChange={(e) => setLocal({ ...local, published: e.target.checked })}
              />
              Published
            </label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-exp">Expiry (optional)</Label>
            <Input
              id="ann-exp"
              type="datetime-local"
              value={local.expiresAt ? local.expiresAt.slice(0, 16) : ""}
              onChange={(e) =>
                setLocal({
                  ...local,
                  expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!local.title.trim() || !local.body.trim()) return;
              onSave({ ...local, title: local.title.trim(), body: local.body.trim() });
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommissionDialog({
  open,
  onOpenChange,
  draft,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: BriefingV1Commission | null;
  onSave: (c: BriefingV1Commission) => void;
}) {
  const [local, setLocal] = useState<BriefingV1Commission | null>(null);
  useEffect(() => {
    if (open && draft) setLocal({ ...draft });
    if (!open) setLocal(null);
  }, [open, draft]);

  if (!local) return null;
  const cats: CommissionCategory[] = ["hotel", "cruise", "tour", "experience", "other"];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-background border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Commission opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              className={cn(
                "min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              value={local.description}
              onChange={(e) => setLocal({ ...local, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Partner</Label>
              <Input value={local.partnerName} onChange={(e) => setLocal({ ...local, partnerName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Commission / bonus</Label>
              <Input
                value={local.commissionLabel}
                onChange={(e) => setLocal({ ...local, commissionLabel: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valid from</Label>
              <Input
                type="date"
                value={local.validFrom}
                onChange={(e) => setLocal({ ...local, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valid until</Label>
              <Input
                type="date"
                value={local.validUntil}
                onChange={(e) => setLocal({ ...local, validUntil: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={local.category}
                onValueChange={(v) => setLocal({ ...local, category: v as CommissionCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  {cats.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Region (optional)</Label>
              <Input value={local.region ?? ""} onChange={(e) => setLocal({ ...local, region: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Link (optional)</Label>
            <Input value={local.link ?? ""} onChange={(e) => setLocal({ ...local, link: e.target.value })} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className={CHECKBOX_CLASS}
              checked={local.published}
              onChange={(e) => setLocal({ ...local, published: e.target.checked })}
            />
            Published
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!local.title.trim() || !local.validFrom || !local.validUntil) return;
              onSave({ ...local, title: local.title.trim() });
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FeaturedDialog({
  open,
  onOpenChange,
  draft,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: BriefingV1Featured | null;
  onSave: (f: BriefingV1Featured) => void;
}) {
  const [local, setLocal] = useState<BriefingV1Featured | null>(null);
  useEffect(() => {
    if (open && draft) setLocal({ ...draft });
    if (!open) setLocal(null);
  }, [open, draft]);

  if (!local) return null;
  const types: FeaturedType[] = ["property", "destination", "document", "collection", "article", "resource"];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Featured item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>One-line description</Label>
            <Input value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={local.typeTag} onValueChange={(v) => setLocal({ ...local, typeTag: v as FeaturedType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Link</Label>
            <Input value={local.href} onChange={(e) => setLocal({ ...local, href: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Thumbnail URL (optional)</Label>
            <Input
              value={local.thumbUrl ?? ""}
              onChange={(e) => setLocal({ ...local, thumbUrl: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Expiry (optional)</Label>
            <Input
              type="datetime-local"
              value={local.expiresAt ? local.expiresAt.slice(0, 16) : ""}
              onChange={(e) =>
                setLocal({
                  ...local,
                  expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className={CHECKBOX_CLASS}
              checked={local.published}
              onChange={(e) => setLocal({ ...local, published: e.target.checked })}
            />
            Published
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!local.title.trim() || !local.href.trim()) return;
              onSave({ ...local, title: local.title.trim(), href: local.href.trim() });
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KvDialog({
  open,
  onOpenChange,
  draft,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: BriefingV1KvHighlight | null;
  onSave: (k: BriefingV1KvHighlight) => void;
}) {
  const [local, setLocal] = useState<BriefingV1KvHighlight | null>(null);
  useEffect(() => {
    if (open && draft) setLocal({ ...draft });
    if (!open) setLocal(null);
  }, [open, draft]);

  if (!local) return null;
  const cats: KvHighlightCategory[] = [
    "program update",
    "destination guide",
    "training",
    "policy",
    "new addition",
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Knowledge Vault highlight</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              className={cn(
                "min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              value={local.description}
              onChange={(e) => setLocal({ ...local, description: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Document link (Enable path)</Label>
            <Input
              value={local.documentHref}
              onChange={(e) => setLocal({ ...local, documentHref: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={local.category}
              onValueChange={(v) => setLocal({ ...local, category: v as KvHighlightCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {cats.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Expiry (optional)</Label>
            <Input
              type="datetime-local"
              value={local.expiresAt ? local.expiresAt.slice(0, 16) : ""}
              onChange={(e) =>
                setLocal({
                  ...local,
                  expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                checked={local.published}
                onChange={(e) => setLocal({ ...local, published: e.target.checked })}
              />
              Published
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                checked={local.isNew}
                onChange={(e) => setLocal({ ...local, isNew: e.target.checked })}
              />
              New badge
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!local.title.trim() || !local.documentHref.trim()) return;
              onSave({ ...local, title: local.title.trim(), documentHref: local.documentHref.trim() });
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
