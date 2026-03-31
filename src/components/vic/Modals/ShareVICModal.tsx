"use client";

import { useState, useMemo } from "react";
import type { VIC, SharedAccess, TeamSharedAccess } from "@/types/vic";
import { getVICId, shareVIC, unshareVIC, unshareVICTeam } from "@/lib/vic-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Users } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useTeams } from "@/contexts/TeamsContext";

const MOCK_ADVISORS = [
  { id: "1", name: "Alex Advisor" },
  { id: "2", name: "Sam Smith" },
  { id: "3", name: "Jordan Lee" },
];

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  none: "Private — only you and assigned advisors",
  basic: "Basic — name and contact only to shared users",
  full: "Full — all fields visible to shared users",
};

type Props = {
  vic: VIC;
  onClose: () => void;
  onSaved: () => void;
};

export default function ShareVICModal({ vic, onClose, onSaved }: Props) {
  const { user } = useUser();
  const { teams } = useTeams();
  const [level, setLevel] = useState<VIC["sharing_level"]>(vic.sharing_level ?? "none");
  const [sharedToAgency, setSharedToAgency] = useState(vic.is_shared_to_agency ?? false);
  const [sharedWith, setSharedWith] = useState<SharedAccess[]>(vic.shared_with ?? []);
  const [sharedWithTeams, setSharedWithTeams] = useState<TeamSharedAccess[]>(vic.shared_with_teams ?? []);
  const [addAdvisorId, setAddAdvisorId] = useState("");
  const [addAccessLevel, setAddAccessLevel] = useState<"view" | "edit">("view");
  const [addTeamId, setAddTeamId] = useState("");
  const [addTeamAccessLevel, setAddTeamAccessLevel] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);

  const teamOptions = useMemo(() => {
    const uid = user?.id != null ? String(user.id) : "";
    return teams.filter((t) => t.isDefault || (uid && t.memberIds.some((m) => String(m) === uid)));
  }, [teams, user?.id]);

  const handleAddAdvisor = () => {
    const advisor = MOCK_ADVISORS.find((a) => a.id === addAdvisorId);
    if (!advisor || sharedWith.some((s) => s.advisor_id === advisor.id)) return;
    setSharedWith((prev) => [
      ...prev,
      {
        advisor_id: advisor.id,
        advisor_name: advisor.name,
        access_level: addAccessLevel,
        shared_at: new Date().toISOString(),
      },
    ]);
    setAddAdvisorId("");
  };

  const handleAddTeam = () => {
    if (!addTeamId) return;
    if (sharedWithTeams.some((s) => s.team_id === addTeamId)) return;
    const team = teamOptions.find((t) => t.id === addTeamId);
    setSharedWithTeams((prev) => [
      ...prev,
      {
        team_id: addTeamId,
        team_name: team?.name,
        access_level: addTeamAccessLevel,
        shared_at: new Date().toISOString(),
      },
    ]);
    setAddTeamId("");
  };

  const handleRemove = (advisorId: string) => {
    setSharedWith((prev) => prev.filter((s) => s.advisor_id !== advisorId));
  };

  const handleRemoveTeam = (teamId: string) => {
    setSharedWithTeams((prev) => prev.filter((s) => s.team_id !== teamId));
  };

  const sharingLevelForApi = level ?? "none";

  const handleSave = async () => {
    setSaving(true);
    try {
      const vicId = getVICId(vic);
      const prevAdvisorIds = new Set((vic.shared_with ?? []).map((s) => s.advisor_id));
      const prevTeamIds = new Set((vic.shared_with_teams ?? []).map((s) => s.team_id));
      const nextAdvisorIds = new Set(sharedWith.map((s) => s.advisor_id));
      const nextTeamIds = new Set(sharedWithTeams.map((s) => s.team_id));

      const removedAdvisors = [...prevAdvisorIds].filter((id) => !nextAdvisorIds.has(id));
      const removedTeams = [...prevTeamIds].filter((id) => !nextTeamIds.has(id));

      const ops: Promise<unknown>[] = [
        ...removedAdvisors.map((advisorId) => unshareVIC(vicId, advisorId).catch(() => {})),
        ...removedTeams.map((teamId) => unshareVICTeam(vicId, teamId).catch(() => {})),
        ...sharedWith
          .filter((s) => !prevAdvisorIds.has(s.advisor_id))
          .map((s) =>
            shareVIC(vicId, {
              advisor_id: s.advisor_id,
              access_level: s.access_level,
              sharing_level: sharingLevelForApi,
            }).catch(() => {})
          ),
        ...sharedWithTeams
          .filter((s) => !prevTeamIds.has(s.team_id))
          .map((s) =>
            shareVIC(vicId, {
              team_id: s.team_id,
              access_level: s.access_level,
              sharing_level: sharingLevelForApi,
            }).catch(() => {})
          ),
      ];
      await Promise.all(ops);
      onSaved();
      onClose();
    } catch {
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const teamIdsInUse = new Set(sharedWithTeams.map((s) => s.team_id));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share VIC</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <Label className="text-muted-foreground">Sharing level</Label>
            <div className="mt-1.5 space-y-2">
              {(["none", "basic", "full"] as const).map((l) => (
                <label key={l} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="level"
                    checked={level === l}
                    onChange={() => setLevel(l)}
                    className="mt-1 rounded border-white/20 bg-white/5"
                  />
                  <span className="text-foreground capitalize">{l === "none" ? "Private" : l}</span>
                  <span className="text-muted-foreground/75 text-xs">— {LEVEL_DESCRIPTIONS[l]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Share with advisors</Label>
            <div className="mt-1.5 flex gap-2 flex-wrap">
              <select
                value={addAdvisorId}
                onChange={(e) => setAddAdvisorId(e.target.value)}
                className="rounded-md border border-input bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground min-w-[140px]"
              >
                <option value="">Select advisor</option>
                {MOCK_ADVISORS.filter((a) => !sharedWith.some((s) => s.advisor_id === a.id)).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <select
                value={addAccessLevel}
                onChange={(e) => setAddAccessLevel(e.target.value as "view" | "edit")}
                className="rounded-md border border-input bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
              <Button type="button" size="sm" variant="outline" onClick={handleAddAdvisor} disabled={!addAdvisorId}>
                Add
              </Button>
            </div>
            {sharedWith.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {sharedWith.map((s) => (
                  <li
                    key={s.advisor_id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-foreground">
                      {s.advisor_name ?? s.advisor_id} · {s.access_level}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground/75"
                      onClick={() => handleRemove(s.advisor_id)}
                    >
                      <X size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Label className="text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" aria-hidden />
              Share with team
            </Label>
            <p className="text-xs text-muted-foreground/75 mt-1 mb-1.5">
              Everyone on the team gets access. New members join automatically.
            </p>
            <div className="mt-1.5 flex gap-2 flex-wrap">
              <select
                value={addTeamId}
                onChange={(e) => setAddTeamId(e.target.value)}
                className="rounded-md border border-input bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground min-w-[160px]"
              >
                <option value="">Select team</option>
                {teamOptions.filter((t) => !teamIdsInUse.has(t.id)).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select
                value={addTeamAccessLevel}
                onChange={(e) => setAddTeamAccessLevel(e.target.value as "view" | "edit")}
                className="rounded-md border border-input bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
              <Button type="button" size="sm" variant="outline" onClick={handleAddTeam} disabled={!addTeamId}>
                Add
              </Button>
            </div>
            {sharedWithTeams.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {sharedWithTeams.map((s) => (
                  <li
                    key={s.team_id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-foreground">
                      <span className="text-muted-foreground/75">Team · </span>
                      {s.team_name ?? s.team_id} · {s.access_level}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground/75"
                      onClick={() => handleRemoveTeam(s.team_id)}
                    >
                      <X size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="agency_visibility"
              checked={sharedToAgency}
              onChange={(e) => setSharedToAgency(e.target.checked)}
              className="checkbox-on-dark"
            />
            <Label htmlFor="agency_visibility" className="font-normal text-foreground">
              Make visible in Agency Directory
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
