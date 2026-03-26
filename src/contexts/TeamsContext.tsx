"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Team } from "@/types/teams";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import {
  INITIAL_MOCK_TEAMS,
  MOCK_AGENCY_USERS,
  getMemberInitials,
  DEFAULT_TEAM_POLICIES,
  type AgencyUser,
} from "@/lib/teamsMock";

function cloneTeams(src: Team[]): Team[] {
  return src.map((t) => ({
    ...t,
    memberIds: [...t.memberIds],
    policies: {
      ...t.policies,
      sourceAccess: t.policies.sourceAccess === "all" ? "all" : [...t.policies.sourceAccess],
    },
  }));
}

type TeamsContextValue = {
  teams: Team[];
  agencyUsers: AgencyUser[];
  getMemberInitials: (memberId: string) => string;
  createTeam: (name: string, memberIds: string[]) => void;
  renameTeam: (id: string, name: string) => void;
  deleteTeam: (id: string) => void;
  toggleTeamMember: (teamId: string, userId: string) => void;
};

const TeamsContext = createContext<TeamsContextValue | null>(null);

export function TeamsProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(() => cloneTeams(INITIAL_MOCK_TEAMS));

  const createTeam = useCallback((name: string, memberIds: string[]) => {
    const trimmed = name.trim();
    if (!trimmed || memberIds.length === 0) return;
    const id = `team-${Date.now()}`;
    setTeams((prev) => [
      ...prev,
      {
        id,
        name: trimmed,
        memberIds: [...new Set(memberIds)],
        isDefault: false,
        policies: { ...DEFAULT_TEAM_POLICIES },
        createdBy: "user-current",
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
  }, []);

  const renameTeam = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name: trimmed } : t)));
  }, []);

  const deleteTeam = useCallback((id: string) => {
    if (id === TEAM_EVERYONE_ID) return;
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTeamMember = useCallback((teamId: string, userId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId || t.isDefault) return t;
        const has = t.memberIds.includes(userId);
        const memberIds = has ? t.memberIds.filter((x) => x !== userId) : [...t.memberIds, userId];
        return { ...t, memberIds };
      })
    );
  }, []);

  const value = useMemo(
    () => ({
      teams,
      agencyUsers: MOCK_AGENCY_USERS,
      getMemberInitials,
      createTeam,
      renameTeam,
      deleteTeam,
      toggleTeamMember,
    }),
    [teams, createTeam, renameTeam, deleteTeam, toggleTeamMember]
  );

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}

export function useTeams(): TeamsContextValue {
  const v = useContext(TeamsContext);
  if (!v) throw new Error("TeamsProvider is required");
  return v;
}

export function useTeamsOptional(): TeamsContextValue | null {
  return useContext(TeamsContext);
}
