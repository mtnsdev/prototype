"use client";

import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, X, Building2, Cloud, FolderOpen, Mail, FileText, Layout, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeams } from "@/contexts/TeamsContext";
import type { HubSnapshot } from "@/components/onboarding/types";
import type { InviteRow } from "@/components/onboarding/InviteTeamModal";

type IntranetPage = {
  id: number;
  title: string;
  is_admin_only: boolean;
};

// Mirrors the Claromentis page list rendered by ClaromentisPageSelector in
// production. Hardcoded for the onboarding prototype until the live API is
// wired in.
const MOCK_INTRANET_PAGES: IntranetPage[] = [
  { id: 101, title: "Policies & training hub", is_admin_only: false },
  { id: 102, title: "Onboarding & first 30 days", is_admin_only: false },
  { id: 103, title: "Supplier guides — Europe", is_admin_only: false },
  { id: 104, title: "Supplier guides — Asia Pacific", is_admin_only: false },
  { id: 105, title: "Supplier guides — Africa & Middle East", is_admin_only: false },
  { id: 106, title: "Supplier guides — Americas", is_admin_only: false },
  { id: 107, title: "Commission & preferred partners", is_admin_only: true },
  { id: 108, title: "Virtuoso programs", is_admin_only: false },
  { id: 109, title: "Brand portals & loyalty programs", is_admin_only: false },
  { id: 110, title: "Destination briefs — Europe", is_admin_only: false },
  { id: 111, title: "Destination briefs — APAC", is_admin_only: false },
  { id: 112, title: "Destination briefs — Africa", is_admin_only: false },
  { id: 113, title: "Cruise & yacht specialists", is_admin_only: false },
  { id: 114, title: "Private aviation & rail", is_admin_only: false },
  { id: 115, title: "VIP & celebrity client playbook", is_admin_only: true },
  { id: 116, title: "Group & MICE handbook", is_admin_only: false },
  { id: 117, title: "Marketing assets & templates", is_admin_only: false },
  { id: 118, title: "HR — internal only", is_admin_only: true },
];

type TeamDraft = {
  id: string;
  name: string;
  /** Selected intranet page ids (matches Claromentis page id shape). */
  pageIds: Set<number>;
  memberEmails: string[];
};

function newTeamDraft(): TeamDraft {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    pageIds: new Set<number>(),
    memberEmails: [],
  };
}

type TeamsBuilderStepProps = {
  hubSnapshot: HubSnapshot;
  agencyName: string;
  onContinue: (inviteRowsForCompletion: InviteRow[] | null) => void;
  onBack: () => void;
  registerAdvance?: (fn: () => void) => void;
};

export function TeamsBuilderStep({
  hubSnapshot,
  agencyName,
  onContinue,
  onBack,
  registerAdvance,
}: TeamsBuilderStepProps) {
  const { createTeam, agencyUsers } = useTeams();
  const [teams, setTeams] = useState<TeamDraft[]>(() => [newTeamDraft()]);

  const hasIntranet = hubSnapshot.intranetConnected;
  const hasShared = hubSnapshot.sharedDriveConnected;
  const hasPersonal = hubSnapshot.personalConnected;
  const hasEmail = hubSnapshot.emailForwardingConfigured;

  const updateTeam = useCallback((id: string, patch: Partial<TeamDraft>) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const togglePage = useCallback((teamId: string, pageId: number) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const next = new Set(t.pageIds);
        if (next.has(pageId)) next.delete(pageId);
        else next.add(pageId);
        return { ...t, pageIds: next };
      })
    );
  }, []);

  const addTeam = useCallback(() => {
    setTeams((prev) => [...prev, newTeamDraft()]);
  }, []);

  const handleContinue = () => {
    const emailToTeamIds = new Map<string, Set<string>>();

    for (const t of teams) {
      const name = t.name.trim();
      if (!name) continue;
      const emails = t.memberEmails
        .map((e) => e.trim())
        .filter(Boolean);
      const memberIds = emails.length > 0 ? emails.map((e) => `invite:${e}`) : ["user-pending"];
      const teamId = createTeam(name, memberIds);
      if (!teamId) continue;
      if (emails.length === 0) continue;
      for (const email of emails) {
        const lower = email.toLowerCase();
        if (!emailToTeamIds.has(lower)) emailToTeamIds.set(lower, new Set());
        emailToTeamIds.get(lower)!.add(teamId);
      }
    }

    let inviteRowsForCompletion: InviteRow[] | null = null;
    if (emailToTeamIds.size > 0) {
      inviteRowsForCompletion = Array.from(emailToTeamIds.entries()).map(([email, idSet], idx) => ({
        id: `invite-from-teams-${idx}-${email}`,
        email,
        role: "user" as const,
        teamIds: [...idSet],
      }));
    }

    onContinue(inviteRowsForCompletion);
  };

  // Bind ⌘/Ctrl+Enter shortcut to the Continue button.
  React.useEffect(() => {
    registerAdvance?.(() => handleContinue());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerAdvance, teams]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-10">
        <p className="font-display mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Step 3 · Set permissions
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">Teams</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
          Create teams to control which <span className="text-foreground">{agencyName}</span> knowledge each group of advisors can access.
        </p>
      </div>

      {/* Active connections summary */}
      <div className="mb-8 rounded-2xl border border-border/40 bg-card/20 p-5 md:p-6">
        <p className="font-display mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Active connections
        </p>
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <ConnectionLine
            icon={Building2}
            label="Agency intranet"
            ok={hasIntranet}
            okText={`${hubSnapshot.intranetDocs || 0} docs · ${hubSnapshot.intranetPages || 0} pages`}
            offText="Not connected"
          />
          <ConnectionLine
            icon={Cloud}
            label="Shared Google Drive"
            ok={hasShared}
            okText={`${hubSnapshot.sharedFolderName || "Agency knowledge"} · ${hubSnapshot.sharedDocs || 0} files`}
            offText="Not connected"
          />
          <ConnectionLine
            icon={FolderOpen}
            label="Personal Google Drive"
            ok={hasPersonal}
            okText={`${hubSnapshot.personalFolderName || "My research"} · ${hubSnapshot.personalDocs || 0} files`}
            offText="Not connected"
          />
          <ConnectionLine
            icon={Mail}
            label="Email forwarding"
            ok={hasEmail}
            okText={hubSnapshot.emailForwardingAddress || "Configured"}
            offText="Not configured"
          />
        </ul>
      </div>

      <div className="space-y-6">
        {teams.map((team, idx) => (
          <div key={team.id} className="rounded-2xl border border-border/40 bg-card/20 p-5 md:p-6">
            <p className="font-display mb-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Team {idx + 1}
            </p>
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor={`tn-${team.id}`}>Team name</Label>
                <Input
                  id={`tn-${team.id}`}
                  value={team.name}
                  onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                  placeholder="e.g. Europe Specialists"
                />
              </div>

              {/* ── Intranet documents ───────────────────────────────────── */}
              <div className="rounded-xl border border-border/30 bg-background/40 p-4 md:p-5">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-foreground/80" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-foreground">Intranet documents</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Advisors log in to the intranet as themselves — whatever document permissions they have
                  there carry over to Enable. Nothing to assign per team.
                </p>
                {!hasIntranet && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Connect the intranet from the Knowledge Hub to inherit document access.
                  </p>
                )}
              </div>

              {/* ── Intranet pages ────────────────────────────────────────── */}
              <div className="rounded-xl border border-border/30 bg-background/40 p-4 md:p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Layout className="h-4 w-4 text-foreground/80" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-foreground">Intranet pages</p>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Pages are hidden from everyone by default. Tick the pages you want this team to access.
                </p>
                {!hasIntranet ? (
                  <p className="text-sm text-muted-foreground">
                    Connect the intranet from the Knowledge Hub to assign pages here.
                  </p>
                ) : (
                  <PageSelector
                    pages={MOCK_INTRANET_PAGES}
                    selectedIds={team.pageIds}
                    onToggle={(pageId) => togglePage(team.id, pageId)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`em-${team.id}`}>Add members</Label>
                <MemberChipInput
                  inputId={`em-${team.id}`}
                  emails={team.memberEmails}
                  onChange={(next) => updateTeam(team.id, { memberEmails: next })}
                  suggestions={agencyUsers}
                />
                <p className="text-xs text-muted-foreground">
                  Pre-assignment only — invites are sent from the next step.
                </p>
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" className="h-8 gap-1 px-2.5 text-xs" onClick={addTeam}>
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add another team
        </Button>
      </div>

      <div className="mt-10 flex flex-wrap justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" className="h-9 text-sm" onClick={onBack}>
          Back
        </Button>
        <Button type="button" size="sm" className="h-9 px-4 text-sm" onClick={handleContinue} data-onboarding-primary>
          Continue
        </Button>
      </div>
    </div>
  );
}

function PageSelector({
  pages,
  selectedIds,
  onToggle,
}: {
  pages: IntranetPage[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = q ? pages.filter((p) => p.title.toLowerCase().includes(q)) : pages;
  const selectedCount = selectedIds.size;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/60" role="region" aria-label="Intranet pages">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Search intranet pages"
        />
        <span className="text-xs text-muted-foreground">
          {selectedCount} of {pages.length} selected
        </span>
      </div>
      <div className="max-h-[260px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            {q ? "No pages match your search" : "No intranet pages found"}
          </p>
        ) : (
          <ul role="listbox" aria-label="Intranet page list" className="py-1">
            {filtered.map((page) => {
              const checked = selectedIds.has(page.id);
              return (
                <li key={page.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(page.id)}
                    className={
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted/40 " +
                      (checked ? "bg-primary/5" : "")
                    }
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={checked}
                      className="pointer-events-none h-4 w-4 shrink-0 rounded border-input"
                    />
                    <FileText className="h-3.5 w-3.5 shrink-0 text-foreground/70" strokeWidth={1.5} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{page.title}</span>
                    {page.is_admin_only && (
                      <span className="ml-auto shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Admin only
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ConnectionLine({
  icon: Icon,
  label,
  ok,
  okText,
  offText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ok: boolean;
  okText: string;
  offText: string;
}) {
  return (
    <li className="flex min-w-0 items-baseline gap-2">
      <Icon className="h-4 w-4 shrink-0 self-center text-foreground/70" />
      <span className="shrink-0 text-sm font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground/40" aria-hidden>
        ·
      </span>
      <span
        className={
          "min-w-0 truncate text-xs " + (ok ? "text-primary" : "text-muted-foreground")
        }
      >
        {ok ? okText : offText}
      </span>
    </li>
  );
}


// ── MemberChipInput ─────────────────────────────────────────────────────
// Slack-style chip input: type a name or email, autocomplete from existing
// agency users, Enter/comma/blur to commit, backspace on empty input to
// remove the last chip.
function MemberChipInput({
  inputId,
  emails,
  onChange,
  suggestions,
}: {
  inputId?: string;
  emails: string[];
  onChange: (next: string[]) => void;
  suggestions: { id: string; name: string; email?: string; initials?: string }[];
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const lower = value.trim().toLowerCase();
  const taken = new Set(emails.map((e) => e.toLowerCase()));
  const filtered = suggestions
    .filter((u) => u.email && !taken.has(u.email.toLowerCase()))
    .filter((u) => {
      if (!lower) return true;
      return (
        u.name.toLowerCase().includes(lower) ||
        (u.email || "").toLowerCase().includes(lower)
      );
    })
    .slice(0, 6);

  // Close suggestion list on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const commit = (raw: string) => {
    const v = raw.trim().replace(/[,;]+$/, "");
    if (!v) return;
    if (taken.has(v.toLowerCase())) {
      setValue("");
      return;
    }
    if (!isValidEmail(v)) return;
    onChange([...emails, v]);
    setValue("");
    setActiveIdx(0);
  };

  const commitSuggestion = (idx: number) => {
    const s = filtered[idx];
    if (!s || !s.email) return;
    if (taken.has(s.email.toLowerCase())) return;
    onChange([...emails, s.email]);
    setValue("");
    setActiveIdx(0);
    inputRef.current?.focus();
  };

  const removeAt = (idx: number) => {
    const next = emails.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div ref={wrapRef} className="relative">
      <span className="sr-only" role="status" aria-live="polite">
        {emails.length} member{emails.length === 1 ? "" : "s"} added
      </span>
      <div
        className="flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((em, i) => {
          const match = suggestions.find((s) => s.email?.toLowerCase() === em.toLowerCase());
          const initials =
            match?.initials ||
            (match?.name || em)
              .split(/[\s.@]+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("");
          return (
            <span
              key={`${em}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-xs text-foreground"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                {initials}
              </span>
              <span className="max-w-[12rem] truncate">{match?.name || em}</span>
              <button
                type="button"
                aria-label={`Remove ${em}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
              >
                <X className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </span>
          );
        })}
        <input
          id={inputId}
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "," || e.key === ";") {
              e.preventDefault();
              if (open && filtered.length > 0) commitSuggestion(activeIdx);
              else commit(value);
              return;
            }
            if (e.key === "Backspace" && value === "" && emails.length > 0) {
              e.preventDefault();
              removeAt(emails.length - 1);
              return;
            }
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "ArrowDown" && filtered.length > 0) {
              e.preventDefault();
              setOpen(true);
              setActiveIdx((i) => (i + 1) % filtered.length);
              return;
            }
            if (e.key === "ArrowUp" && filtered.length > 0) {
              e.preventDefault();
              setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
              return;
            }
          }}
          onBlur={() => {
            if (value.trim()) commit(value);
          }}
          placeholder={emails.length === 0 ? "Add people by name or email…" : ""}
          className="min-w-[10rem] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          autoComplete="off"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          aria-label="Member suggestions"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
        >
          {filtered.map((u, i) => (
            <li key={u.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitSuggestion(i);
                }}
                className={
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors " +
                  (i === activeIdx ? "bg-muted/60" : "hover:bg-muted/40")
                }
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {u.initials || u.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{u.name}</span>
                  {u.email && (
                    <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

