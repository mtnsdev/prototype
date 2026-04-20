"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { isWorkspaceStaff } from "@/lib/workspaceRoles";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { APP_PAGE_CONTENT_SHELL } from "@/lib/dashboardChrome";
import { cn } from "@/lib/utils";

type SourceRow = {
  id: string;
  label: string;
  connectedBy: string;
  documentCount: number;
  defaultScope: "private" | string;
};

const INITIAL_SOURCES: SourceRow[] = [
  {
    id: "google_drive_admin",
    label: "Google Drive — Shared",
    connectedBy: "Kristin",
    documentCount: 245,
    defaultScope: TEAM_EVERYONE_ID,
  },
  {
    id: "google_drive_personal",
    label: "Google Drive — Personal",
    connectedBy: "—",
    documentCount: 67,
    defaultScope: "private",
  },
  {
    id: "intranet_documents",
    label: "Intranet — Documents",
    connectedBy: "Admin",
    documentCount: 198,
    defaultScope: TEAM_EVERYONE_ID,
  },
  {
    id: "intranet_pages",
    label: "Intranet — Pages",
    connectedBy: "Admin",
    documentCount: 140,
    defaultScope: TEAM_EVERYONE_ID,
  },
  {
    id: "email",
    label: "Email ingestion",
    connectedBy: "—",
    documentCount: 12,
    defaultScope: "private",
  },
];

export default function SourcesSettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const toast = useToast();
  const [sources, setSources] = useState<SourceRow[]>(() => [...INITIAL_SOURCES]);

  const isAdmin = isWorkspaceStaff(user);

  const canAccess = useMemo(() => {
    if (typeof window === "undefined") return true;
    return Boolean(localStorage.getItem("auth_token"));
  }, []);

  const updateDefault = useCallback(
    (sourceId: string, nextScope: string) => {
      if (
        !window.confirm(
          "This will apply to all new documents from this source. Existing documents won't change."
        )
      ) {
        return;
      }
      setSources((prev) =>
        prev.map((s) =>
          s.id === sourceId
            ? { ...s, defaultScope: nextScope === "private" ? "private" : nextScope }
            : s
        )
      );
      toast({ title: "Default access updated (demo)", tone: "success" });
    },
    [toast]
  );

  if (!canAccess) {
    router.push("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="h-full overflow-y-auto bg-background p-6">
        <p className="text-sm text-muted-foreground/90">You need admin access to configure source defaults.</p>
        <Button variant="outline" className="mt-4 border-input" asChild>
          <Link href="/dashboard/settings">Back to settings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground">
      <div className={cn(APP_PAGE_CONTENT_SHELL, "py-6")}>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="w-3 h-3" />
          Settings
        </Link>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Knowledge sources</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Default access for new documents per connection. Private vs team visibility uses your Teams model.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-foreground/[0.03] border border-white/[0.04] rounded-xl"
            >
              <div className="min-w-0">
                <span className="text-xs text-white block">{source.label}</span>
                <span className="text-2xs text-muted-foreground block mt-0.5">
                  Connected by {source.connectedBy} · {source.documentCount} documents
                </span>
              </div>
              <select
                value={source.defaultScope}
                onChange={(e) => updateDefault(source.id, e.target.value)}
                className="text-2xs bg-white/[0.03] border border-white/[0.04] rounded-lg px-2 py-1.5 text-muted-foreground/90 outline-none shrink-0"
              >
                <option value="private">Private</option>
                {MOCK_TEAMS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
