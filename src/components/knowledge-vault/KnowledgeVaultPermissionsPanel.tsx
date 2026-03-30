"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Plus, MoreHorizontal, Mail, Cloud, Database, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataSource } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { useTeams } from "@/contexts/TeamsContext";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { useToast } from "@/contexts/ToastContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AGENCY_EMAIL_INGEST_ADDRESS } from "@/config/emailIngest";

type Tab = "teams" | "sources";

function TeamsTab() {
  const toast = useToast();
  const { teams, getMemberInitials } = useTeams();
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => toast("Create team (demo)")}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-white/[0.12]"
      >
        <Plus className="w-3 h-3" /> Create Team
      </button>
      {teams.map((team) => (
        <div key={team.id} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-white font-medium truncate">{team.name}</span>
              {team.isDefault && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-muted-foreground uppercase tracking-wider shrink-0">
                  Default
                </span>
              )}
            </div>
            {!team.isDefault && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground/70 hover:text-muted-foreground p-1 rounded"
                    aria-label={`More actions for ${team.name}`}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-xs" onClick={() => toast(`Rename ${team.name} (demo)`)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs text-red-400/80"
                    onClick={() => toast(`Delete ${team.name} (demo)`)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <span className="text-2xs text-muted-foreground">
            {team.isDefault ? "All advisors (automatic)" : `${team.memberIds.length} members`}
          </span>
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {team.memberIds.slice(0, 5).map((memberId) => (
              <div
                key={memberId}
                className="w-5 h-5 rounded-full bg-white/[0.06] border border-border flex items-center justify-center"
                title={memberId}
              >
                <span className="text-[8px] text-muted-foreground/90">{getMemberInitials(memberId)}</span>
              </div>
            ))}
            {team.memberIds.length > 5 && (
              <span className="text-[9px] text-muted-foreground">+{team.memberIds.length - 5}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => toast(`Manage members — ${team.name} (demo)`)}
            className="text-2xs text-blue-400/50 hover:text-blue-400/70 mt-2"
          >
            Manage members
          </button>
        </div>
      ))}
    </div>
  );
}

function sourceIconBg(source: DataSource): string {
  if (source.source_type === DataSourceType.Email) return "bg-sky-500/10 text-sky-400";
  if (source.source_type === DataSourceType.GoogleDrivePersonal) return "bg-white/10 text-[rgba(245,245,245,0.85)]";
  return "bg-white/10 text-[rgba(245,245,245,0.85)]";
}

function SourceRowIcon({ source }: { source: DataSource }) {
  if (source.source_type === DataSourceType.Email)
    return (
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", sourceIconBg(source))}>
        <Mail className="w-4 h-4" />
      </div>
    );
  if (source.icon === "Cloud")
    return (
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", sourceIconBg(source))}>
        <Cloud className="w-4 h-4" />
      </div>
    );
  return (
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", sourceIconBg(source))}>
      <Database className="w-4 h-4" />
    </div>
  );
}

function initScopesForSources(sourceList: DataSource[]): Record<string, string> {
  const init: Record<string, string> = {};
  for (const s of sourceList) {
    if (s.source_type === DataSourceType.GoogleDriveAdmin) init[s.id] = TEAM_EVERYONE_ID;
    else if (s.source_type === DataSourceType.GoogleDrivePersonal) init[s.id] = "private";
    else if (s.source_type === DataSourceType.IntranetDocuments) init[s.id] = "mirrors_source";
    else if (s.source_type === DataSourceType.IntranetPages) init[s.id] = "private";
    else if (s.source_type === DataSourceType.Email) init[s.id] = "private";
    else init[s.id] = TEAM_EVERYONE_ID;
  }
  return init;
}

function SourceDefaultsTab({ sources }: { sources: DataSource[] }) {
  const toast = useToast();
  const { teams } = useTeams();

  const scopeLabel = useCallback(
    (value: string) => {
      if (value === "private") return "Private";
      if (value === "mirrors_source") return "Based on access";
      return teams.find((t) => t.id === value)?.name ?? value;
    },
    [teams]
  );
  const [savedScopes, setSavedScopes] = useState<Record<string, string>>({});
  const [draftScopes, setDraftScopes] = useState<Record<string, string>>({});
  const [applyRetro, setApplyRetro] = useState<Record<string, boolean>>({});
  const [confirmRetro, setConfirmRetro] = useState<{
    sourceId: string;
    oldScope: string;
    newScope: string;
    count: number;
  } | null>(null);

  useEffect(() => {
    const init = initScopesForSources(sources);
    setSavedScopes(init);
    setDraftScopes(init);
    setApplyRetro({});
  }, [sources]);

  const setRetro = useCallback((sourceId: string, checked: boolean) => {
    setApplyRetro((prev) => ({ ...prev, [sourceId]: checked }));
  }, []);

  const saveSource = useCallback(
    (source: DataSource) => {
      const id = source.id;
      const newV = draftScopes[id] ?? "private";
      const oldV = savedScopes[id] ?? "private";
      if (applyRetro[id]) {
        setConfirmRetro({
          sourceId: id,
          oldScope: oldV,
          newScope: newV,
          count: source.document_count,
        });
        return;
      }
      setSavedScopes((prev) => ({ ...prev, [id]: newV }));
      toast(`Default access updated for ${source.name}.`);
      setApplyRetro((a) => ({ ...a, [id]: false }));
    },
    [applyRetro, draftScopes, savedScopes, toast]
  );

  const confirmApplyRetro = useCallback(() => {
    if (!confirmRetro) return;
    const name = scopeLabel(confirmRetro.newScope);
    setSavedScopes((prev) => ({ ...prev, [confirmRetro.sourceId]: confirmRetro.newScope }));
    toast(
      `Default access updated. ${confirmRetro.count} existing documents set to ${name}.`
    );
    setApplyRetro((a) => ({ ...a, [confirmRetro.sourceId]: false }));
    setConfirmRetro(null);
  }, [confirmRetro, toast, scopeLabel]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Set the default visibility for new documents from each source.
      </p>
      {sources.map((source) => {
        const locked = source.source_type === DataSourceType.IntranetDocuments;
        const draft = draftScopes[source.id] ?? "private";
        const saved = savedScopes[source.id] ?? "private";
        const dirty = !locked && draft !== saved;

        return (
          <div key={source.id} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <SourceRowIcon source={source} />
              <div className="min-w-0">
                <span className="text-sm text-white block truncate">{source.name}</span>
                <div className="text-2xs text-muted-foreground">{source.document_count} documents</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xs text-muted-foreground uppercase tracking-wider shrink-0">Default access</span>
              {locked ? (
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-hidden />
                  <span className="text-xs text-muted-foreground/90">Based on access</span>
                </div>
              ) : (
                <select
                  value={draft}
                  onChange={(e) => setDraftScopes((prev) => ({ ...prev, [source.id]: e.target.value }))}
                  className="text-xs bg-white/[0.04] border border-border rounded-lg px-2 py-1 text-foreground/88 appearance-none cursor-pointer max-w-[180px]"
                >
                  <option value="private">Private</option>
                  {teams.filter((t) => t.id !== TEAM_EVERYONE_ID).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                  <option value={TEAM_EVERYONE_ID}>Everyone</option>
                </select>
              )}
            </div>
            {source.source_type === DataSourceType.IntranetPages && (
              <p className="text-[9px] text-muted-foreground/70 mt-2 italic leading-relaxed">
                Intranet pages default to Private — admins can share with teams as needed
              </p>
            )}
            {!locked && dirty && (
              <>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(applyRetro[source.id])}
                    onChange={(e) => setRetro(source.id, e.target.checked)}
                    className="checkbox-on-dark checkbox-on-dark-sm"
                  />
                  <span className="text-2xs text-muted-foreground/90">
                    Apply to existing {source.document_count} documents from this source
                  </span>
                </label>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 w-full text-xs bg-white/[0.06] border border-border text-foreground/90 hover:bg-white/[0.1]"
                  onClick={() => saveSource(source)}
                >
                  Save default
                </Button>
              </>
            )}
          </div>
        );
      })}
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 mt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="text-sm text-white">Email Forwarding</span>
            <div className="text-2xs text-muted-foreground">Forward emails to ingest into KV</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
          <code className="text-xs text-foreground/88 flex-1 truncate">{AGENCY_EMAIL_INGEST_ADDRESS}</code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(AGENCY_EMAIL_INGEST_ADDRESS);
              toast("Copied ingest address");
            }}
            className="text-2xs text-blue-400/50 hover:text-blue-400/70 shrink-0"
          >
            Copy
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground/70 mt-2 leading-relaxed">
          Forwarded emails land as Private by default. Admins can share them with teams afterward.
        </p>
      </div>

      <Dialog open={confirmRetro != null} onOpenChange={(o) => !o && setConfirmRetro(null)}>
        <DialogContent
          showCloseButton
          className="bg-background border border-border sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Apply access change to existing documents?</DialogTitle>
            <DialogDescription className="text-muted-foreground/90 text-sm">
              {confirmRetro && (
                <>
                  This will change access for {confirmRetro.count} existing documents from &quot;
                  {scopeLabel(confirmRetro.oldScope)}&quot; to &quot;{scopeLabel(confirmRetro.newScope)}&quot;.
                  This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-white/[0.04] text-sm text-foreground/88"
              onClick={() => setConfirmRetro(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 hover:bg-blue-500/15"
              onClick={confirmApplyRetro}
            >
              {confirmRetro ? `Apply to all ${confirmRetro.count} documents` : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Props = {
  sources: DataSource[];
  onClose: () => void;
};

export default function KnowledgeVaultPermissionsPanel({ sources, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("teams");
  const connected = useMemo(() => sources.filter((s) => s.status !== "disconnected"), [sources]);

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden bg-muted border-border",
        "fixed inset-0 z-50 md:relative md:inset-auto md:w-[400px] md:max-w-[100vw] md:shrink-0 md:border-l md:z-auto"
      )}
    >
      <div className="shrink-0 flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-medium text-white">Permissions</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-muted-foreground/90 hover:text-white hover:bg-white/[0.06]"
          aria-label="Close permissions"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex gap-1 bg-white/[0.02] rounded-lg p-0.5 mb-6">
          <button
            type="button"
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === "teams" ? "bg-white/[0.06] text-white" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("teams")}
          >
            Teams
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === "sources" ? "bg-white/[0.06] text-white" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("sources")}
          >
            Source Defaults
          </button>
        </div>
        {activeTab === "teams" ? (
          <TeamsTab />
        ) : (
          <SourceDefaultsTab sources={connected} />
        )}
      </div>
    </aside>
  );
}
