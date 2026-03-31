/**
 * In-memory VIC store for local /api/vics routes (prototype).
 * Initialized from FAKE_VICS; mutations persist for the server process lifetime.
 */

import { FAKE_VICS, filterAndPaginateFakeVics, type FilterParams } from "@/components/vic/fakeData";
import { getVICId } from "@/lib/vic-api";
import type { VIC, AccessLevel, SharingLevel } from "@/types/vic";
import { INITIAL_MOCK_TEAMS } from "@/lib/teamsMock";

let store: VIC[] | null = null;

function deepCloneVics(): VIC[] {
  return JSON.parse(JSON.stringify(FAKE_VICS)) as VIC[];
}

export function getVicStore(): VIC[] {
  if (!store) store = deepCloneVics();
  return store;
}

export function findVicIndex(id: string): number {
  return getVicStore().findIndex((v) => getVICId(v) === id);
}

export function getVicById(id: string): VIC | undefined {
  const i = findVicIndex(id);
  if (i === -1) return undefined;
  return getVicStore()[i];
}

export function listVics(params: {
  tab?: string;
  mockUserId: string;
  search?: string;
  country?: string;
  status?: string;
  acuity_status?: string;
  sort_by?: string;
  sort_order?: string;
  page?: string;
  limit?: string;
}): { vics: VIC[]; total: number } {
  const page = params.page ? Number.parseInt(params.page, 10) : 1;
  const limit = params.limit ? Number.parseInt(params.limit, 10) : 20;
  const fp: FilterParams = {
    tab: params.tab === "shared" ? "shared" : "mine",
    userId: params.mockUserId,
    teams: INITIAL_MOCK_TEAMS,
    search: params.search,
    country: params.country,
    status: params.status,
    acuityStatus: params.acuity_status,
    sortBy: params.sort_by ?? "full_name",
    sortOrder: params.sort_order === "desc" ? "desc" : "asc",
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 20,
  };
  return filterAndPaginateFakeVics(getVicStore(), fp);
}

export function putVic(id: string, patch: Partial<VIC>): VIC | null {
  const list = getVicStore();
  const i = findVicIndex(id);
  if (i === -1) return null;
  const cur = list[i];
  if (!cur) return null;
  const next = { ...cur, ...patch } as VIC;
  list[i] = next;
  return next;
}

export function deleteVic(id: string): boolean {
  const list = getVicStore();
  const i = findVicIndex(id);
  if (i === -1) return false;
  list.splice(i, 1);
  return true;
}

export function appendVic(body: Partial<VIC>): VIC {
  const list = getVicStore();
  const id = `vic-${Date.now()}`;
  const v = { ...body, id, _id: id, full_name: body.full_name ?? "New VIC" } as VIC;
  list.push(v);
  return v;
}

export function applyShare(
  vicId: string,
  body: {
    advisor_id?: string;
    team_id?: string;
    access_level: AccessLevel;
    sharing_level?: SharingLevel;
  }
): VIC | null {
  const v = getVicById(vicId);
  if (!v) return null;
  const sharing_level = body.sharing_level ?? v.sharing_level;
  const shared_with = [...(v.shared_with ?? [])];
  const shared_with_teams = [...(v.shared_with_teams ?? [])];

  if (body.advisor_id) {
    const idx = shared_with.findIndex((s) => String(s.advisor_id) === String(body.advisor_id));
    const prevName = idx >= 0 ? shared_with[idx]!.advisor_name : undefined;
    const row = {
      advisor_id: String(body.advisor_id),
      advisor_name: prevName,
      access_level: body.access_level,
      shared_at: new Date().toISOString(),
    };
    if (idx >= 0) shared_with[idx] = { ...shared_with[idx]!, ...row };
    else shared_with.push(row);
  }
  if (body.team_id) {
    const idx = shared_with_teams.findIndex((s) => s.team_id === body.team_id);
    const tname = INITIAL_MOCK_TEAMS.find((t) => t.id === body.team_id)?.name;
    const row = {
      team_id: body.team_id,
      team_name: tname,
      access_level: body.access_level,
      shared_at: new Date().toISOString(),
    };
    if (idx >= 0) shared_with_teams[idx] = { ...shared_with_teams[idx]!, ...row };
    else shared_with_teams.push(row);
  }

  return putVic(vicId, {
    sharing_level: sharing_level ?? v.sharing_level,
    shared_with,
    shared_with_teams,
  });
}

export function removeAdvisorShare(vicId: string, advisorId: string): VIC | null {
  const v = getVicById(vicId);
  if (!v) return null;
  const shared_with = (v.shared_with ?? []).filter((s) => String(s.advisor_id) !== String(advisorId));
  return putVic(vicId, { shared_with });
}

export function removeTeamShare(vicId: string, teamId: string): VIC | null {
  const v = getVicById(vicId);
  if (!v) return null;
  const shared_with_teams = (v.shared_with_teams ?? []).filter((s) => s.team_id !== teamId);
  return putVic(vicId, { shared_with_teams });
}
