"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { useUser } from "@/contexts/UserContext";
import { isWorkspaceStaff } from "@/lib/workspaceRoles";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import type { Team } from "@/types/teams";
import { DEFAULT_TEAM_POLICIES, MOCK_TEAMS } from "@/lib/teamsMock";
import { BRIEFING_ROOM_PATH } from "@/lib/briefingRoutes";

function cloneTeams(t: Team[]): Team[] {
  return t.map((x) => ({
    ...x,
    memberIds: [...x.memberIds],
    policies: {
      ...x.policies,
      sourceAccess: x.policies.sourceAccess === "all" ? "all" : [...x.policies.sourceAccess],
    },
  }));
}

export default function TeamsSettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const toast = useToast();
  const [teams, setTeams] = useState<Team[]>(() => cloneTeams(MOCK_TEAMS));

  const isAdmin = isWorkspaceStaff(user);

  const canAccess = useMemo(() => {
    if (typeof window === "undefined") return true;
    return Boolean(localStorage.getItem("auth_token"));
  }, []);

  const createTeam = useCallback(() => {
    const name = window.prompt("Team name");
    if (!name?.trim()) return;
    const id = `team-${Date.now()}`;
    setTeams((prev) => [
      ...prev,
      {
        id,
        name: name.trim(),
        memberIds: user?.id != null ? [String(user.id)] : [],
        isDefault: false,
        policies: { ...DEFAULT_TEAM_POLICIES },
        createdBy: user?.email ?? "admin",
        createdAt: new Date().toISOString(),
      },
    ]);
    toast({ title: "Team created (demo)", tone: "success" });
  }, [toast, user]);

  const deleteTeam = useCallback(
    (t: Team) => {
      if (t.isDefault) return;
      if (!window.confirm(`Delete team "${t.name}"?`)) return;
      setTeams((prev) => prev.filter((x) => x.id !== t.id));
      toast({ title: "Team removed (demo)", tone: "success" });
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
        <p className="text-sm text-muted-foreground/90">You need admin access to manage teams.</p>
        <Button variant="outline" className="mt-4 border-input" asChild>
          <Link href="/dashboard/settings">Back to settings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: BRIEFING_ROOM_PATH },
            { label: "Settings", href: "/dashboard/settings" },
            { label: "Teams" },
          ]}
          className="mb-3"
        />
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="w-3 h-3" />
          Settings
        </Link>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Teams</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create teams to scope shared content. Everyone is included in the default team automatically.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-white">{team.name}</span>
                  {team.isDefault && (
                    <span className="text-2xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">Default</span>
                  )}
                </div>
                <span className="text-2xs text-muted-foreground">
                  {team.isDefault ? "All advisors" : `${team.memberIds.length} members`}
                </span>
              </div>
              {!team.isDefault && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="text-2xs text-muted-foreground hover:text-muted-foreground"
                    onClick={() =>
                      toast({
                        title: "Team editor — connect API in production",
                        tone: "success",
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-2xs text-muted-foreground hover:text-red-400"
                    onClick={() => deleteTeam(team)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={createTeam}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Create team
        </button>
      </div>
    </div>
  );
}
