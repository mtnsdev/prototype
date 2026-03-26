"use client";

import { useCallback, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import type { Team } from "@/types/teams";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { useTeams } from "@/contexts/TeamsContext";
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

export default function TeamsManagementSection() {
  const toast = useToast();
  const { teams, agencyUsers, getMemberInitials, createTeam, renameTeam, deleteTeam, toggleTeamMember } =
    useTeams();

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);

  const sortedTeams = useMemo(() => {
    const copy = [...teams];
    copy.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return copy;
  }, [teams]);

  const openCreate = useCallback(() => {
    setNewTeamName("");
    setSelectedMembers([]);
    setShowCreateTeam(true);
  }, []);

  const toggleMember = useCallback((userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]
    );
  }, []);

  const commitCreate = useCallback(() => {
    if (!newTeamName.trim()) return;
    if (selectedMembers.length < 1) {
      toast("Select at least one member");
      return;
    }
    createTeam(newTeamName, selectedMembers);
    toast("Team created");
    setShowCreateTeam(false);
    setNewTeamName("");
    setSelectedMembers([]);
  }, [createTeam, newTeamName, selectedMembers, toast]);

  const openRename = useCallback((team: Team) => {
    setEditingTeam(team);
    setRenameValue(team.name);
  }, []);

  const commitRename = useCallback(() => {
    if (!editingTeam) return;
    renameTeam(editingTeam.id, renameValue);
    toast("Team renamed");
    setEditingTeam(null);
  }, [editingTeam, renameTeam, renameValue, toast]);

  const confirmDelete = useCallback(() => {
    if (!deletingTeam) return;
    deleteTeam(deletingTeam.id);
    toast("Team deleted — content scoped to this team is now treated as Everyone (demo)");
    setDeletingTeam(null);
  }, [deleteTeam, deletingTeam, toast]);

  const managingTeamLive = useMemo(
    () => (managingTeam ? teams.find((t) => t.id === managingTeam.id) ?? managingTeam : null),
    [teams, managingTeam]
  );

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <h3 className="text-base font-medium text-white">Teams</h3>
            <p className="text-sm text-gray-500">
              Manage teams to control content visibility across the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={openCreate}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-dashed border-white/[0.08] text-xs text-gray-500 hover:text-gray-300 hover:border-white/[0.12] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Create Team
        </button>

        {sortedTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            getMemberInitials={getMemberInitials}
            onRename={() => openRename(team)}
            onDelete={() => setDeletingTeam(team)}
            onManageMembers={() => setManagingTeam(team)}
          />
        ))}
      </div>

      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent className="bg-[#0e0e12] border border-white/[0.06] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                Team Name
              </label>
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Europe Specialists"
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-white/10"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Members</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {agencyUsers.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user.id)}
                      onChange={() => toggleMember(user.id)}
                      className="checkbox-on-dark checkbox-on-dark-sm"
                    />
                    <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                      <span className="text-[8px] text-gray-400">
                        {user.initials ?? user.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-300">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setShowCreateTeam(false)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commitCreate}
              disabled={!newTeamName.trim() || selectedMembers.length < 1}
              className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 disabled:opacity-40"
            >
              Create Team
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTeam} onOpenChange={(o) => !o && setEditingTeam(null)}>
        <DialogContent className="bg-[#0e0e12] border border-white/[0.06] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Rename team</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Team Name</label>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-white/10"
            />
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setEditingTeam(null)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commitRename}
              disabled={!renameValue.trim()}
              className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 disabled:opacity-40"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingTeam} onOpenChange={(o) => !o && setDeletingTeam(null)}>
        <DialogContent className="bg-[#0e0e12] border border-white/[0.06] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete &quot;{deletingTeam?.name}&quot;?</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm mt-2">
              All content currently scoped to this team will be moved to &quot;Everyone&quot; (visible to the whole
              agency). This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setDeletingTeam(null)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400"
            >
              Delete team
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!managingTeam} onOpenChange={(o) => !o && setManagingTeam(null)}>
        <DialogContent className="bg-[#0e0e12] border border-white/[0.06] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Members — {managingTeamLive?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto mt-4 pr-1">
            {agencyUsers.map((user) => {
              const checked = managingTeamLive?.memberIds.includes(user.id) ?? false;
              const disabled = managingTeamLive?.isDefault === true;
              return (
                <label
                  key={user.id}
                  className={`flex items-center gap-3 py-1.5 ${disabled ? "cursor-default opacity-90" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (managingTeamLive && !managingTeamLive.isDefault) {
                        toggleTeamMember(managingTeamLive.id, user.id);
                      }
                    }}
                    className="checkbox-on-dark checkbox-on-dark-sm"
                    disabled={disabled}
                  />
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-[9px] text-gray-400">
                      {user.initials ?? user.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-300">{user.name}</span>
                    {user.role && (
                      <span className="text-[10px] text-gray-500 ml-2">{user.role}</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          {managingTeamLive?.isDefault && (
            <p className="text-[10px] text-gray-600 mt-2 italic">
              The &quot;Everyone&quot; team automatically includes all users. Membership cannot be changed.
            </p>
          )}
          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setManagingTeam(null)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-gray-300"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamCard({
  team,
  getMemberInitials,
  onRename,
  onDelete,
  onManageMembers,
}: {
  team: Team;
  getMemberInitials: (id: string) => string;
  onRename: () => void;
  onDelete: () => void;
  onManageMembers: () => void;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-white font-medium truncate">{team.name}</span>
          {team.isDefault && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-500 uppercase tracking-wider shrink-0">
              Default
            </span>
          )}
        </div>
        {!team.isDefault && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-md hover:bg-white/[0.06] text-gray-600 hover:text-gray-400 shrink-0"
                aria-label="Team actions"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0e0e12] border border-white/[0.06]">
              <DropdownMenuItem onClick={onRename} className="text-sm text-gray-300 focus:text-white">
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-sm text-red-400 focus:text-red-300 focus:bg-red-500/10"
              >
                Delete team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <span className="text-[10px] text-gray-500">{team.memberIds.length} members</span>

      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {team.memberIds.slice(0, 5).map((memberId) => (
          <div
            key={memberId}
            className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center"
          >
            <span className="text-[9px] text-gray-400">{getMemberInitials(memberId)}</span>
          </div>
        ))}
        {team.memberIds.length > 5 && (
          <span className="text-[9px] text-gray-500 ml-1">+{team.memberIds.length - 5}</span>
        )}
      </div>

      <button
        type="button"
        onClick={onManageMembers}
        className="text-[10px] text-blue-400/50 hover:text-blue-400/70 mt-2 block text-left"
      >
        Manage members
      </button>
    </div>
  );
}
