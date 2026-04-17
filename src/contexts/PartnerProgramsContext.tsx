"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPartnerProgramsSeedSnapshot } from "@/lib/partnerProgramsSeed";
import type {
  PartnerProgramsSnapshot,
  ProductProgramLink,
  Program,
  Incentive,
} from "@/types/partner-programs";

const STORAGE_KEY = "enable_partner_programs_v2";

function stripLegacyIncentiveFields(p: Record<string, unknown>): Record<string, unknown> {
  const { type: _t, status: _s, ...rest } = p;
  return rest;
}

function normalizeIncentiveRecord(raw: Record<string, unknown>): Incentive {
  const row = stripLegacyIncentiveFields(raw);
  const createdAt = String(row.createdAt ?? new Date().toISOString());
  const createdBy = String(row.createdBy ?? "unknown");
  const updatedAt =
    typeof row.updatedAt === "string" && row.updatedAt.trim() !== "" ? row.updatedAt : createdAt;
  const updatedBy =
    typeof row.updatedBy === "string" && row.updatedBy.trim() !== "" ? row.updatedBy : createdBy;
  return { ...row, createdAt, createdBy, updatedAt, updatedBy } as unknown as Incentive;
}

function normalizeProgramRecord(p: Program & { notes?: string | null }): Program {
  const legacyNotes = p.notes;
  const { notes: _n, ...rest } = p;
  const customAmenities = Array.isArray(rest.customAmenities)
    ? rest.customAmenities.filter((s) => typeof s === "string" && s.trim() !== "").map((s) => s.trim())
    : [];
  return {
    ...rest,
    customAmenities,
    agencyTerms: rest.agencyTerms ?? (legacyNotes != null && legacyNotes !== "" ? legacyNotes : null),
    agencyNegotiatedRate: rest.agencyNegotiatedRate ?? null,
  };
}

function coerceSnapshot(parsed: Record<string, unknown>): PartnerProgramsSnapshot | null {
  const programsRaw = parsed.programs;
  const linksRaw = parsed.links;
  if (!Array.isArray(programsRaw) || !Array.isArray(linksRaw)) return null;

  const incentivesRaw = parsed.incentives ?? parsed.promotions;
  if (!Array.isArray(incentivesRaw)) return null;

  return {
    programs: programsRaw.map((row) => normalizeProgramRecord(row as Program & { notes?: string | null })),
    links: linksRaw as ProductProgramLink[],
    incentives: incentivesRaw.map((pr) =>
      normalizeIncentiveRecord(pr as unknown as Record<string, unknown>)
    ),
  };
}

function persistSnapshot(s: PartnerProgramsSnapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function loadSnapshot(): PartnerProgramsSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const coerced = coerceSnapshot(parsed);
      if (coerced) return coerced;
    }
  } catch {
    /* ignore */
  }
  try {
    const legacy = localStorage.getItem("enable_partner_programs_v1");
    if (legacy) {
      const parsed = JSON.parse(legacy) as Record<string, unknown>;
      const coerced = coerceSnapshot(parsed);
      if (coerced) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(coerced));
        } catch {
          /* ignore */
        }
        localStorage.removeItem("enable_partner_programs_v1");
        return coerced;
      }
    }
  } catch {
    /* ignore */
  }
  return createPartnerProgramsSeedSnapshot();
}

export type PartnerProgramsContextValue = {
  snapshot: PartnerProgramsSnapshot;
  /** Bumps when snapshot changes — for directory memo deps. */
  revision: number;
  upsertProgram: (program: Program) => void;
  removeProgram: (programId: string) => void;
  upsertLink: (link: ProductProgramLink) => void;
  removeLink: (linkId: string) => void;
  upsertIncentive: (incentive: Incentive) => void;
  removeIncentive: (incentiveId: string) => void;
  resetToSeed: () => void;
};

const PartnerProgramsContext = createContext<PartnerProgramsContextValue | null>(null);

export function PartnerProgramsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PartnerProgramsSnapshot>(createPartnerProgramsSeedSnapshot);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setSnapshot(loadSnapshot());
    setRevision((r) => r + 1);
  }, []);

  const bump = useCallback(() => setRevision((r) => r + 1), []);

  const upsertProgram = useCallback(
    (program: Program) => {
      setSnapshot((prev) => {
        const idx = prev.programs.findIndex((p) => p.id === program.id);
        const programs =
          idx >= 0
            ? prev.programs.map((p, i) => (i === idx ? program : p))
            : [...prev.programs, program];
        const next: PartnerProgramsSnapshot = { ...prev, programs };
        persistSnapshot(next);
        return next;
      });
      bump();
    },
    [bump]
  );

  const removeProgram = useCallback(
    (programId: string) => {
      setSnapshot((prev) => {
        const next: PartnerProgramsSnapshot = {
          ...prev,
          programs: prev.programs.filter((p) => p.id !== programId),
          links: prev.links.filter((l) => l.programId !== programId),
          incentives: prev.incentives.filter((pr) => pr.programId !== programId),
        };
        persistSnapshot(next);
        return next;
      });
      bump();
    },
    [bump]
  );

  const upsertLink = useCallback(
    (link: ProductProgramLink) => {
      setSnapshot((prev) => {
        const idx = prev.links.findIndex((l) => l.id === link.id);
        const links =
          idx >= 0 ? prev.links.map((l, i) => (i === idx ? link : l)) : [...prev.links, link];
        const next: PartnerProgramsSnapshot = { ...prev, links };
        persistSnapshot(next);
        return next;
      });
      bump();
    },
    [bump]
  );

  const removeLink = useCallback(
    (linkId: string) => {
      setSnapshot((prev) => {
        const next: PartnerProgramsSnapshot = {
          ...prev,
          links: prev.links.filter((l) => l.id !== linkId),
        };
        persistSnapshot(next);
        return next;
      });
      bump();
    },
    [bump]
  );

  const upsertIncentive = useCallback(
    (incentive: Incentive) => {
      setSnapshot((prev) => {
        const idx = prev.incentives.findIndex((p) => p.id === incentive.id);
        const incentives =
          idx >= 0
            ? prev.incentives.map((p, i) => (i === idx ? incentive : p))
            : [...prev.incentives, incentive];
        const next: PartnerProgramsSnapshot = { ...prev, incentives };
        persistSnapshot(next);
        return next;
      });
      bump();
    },
    [bump]
  );

  const removeIncentive = useCallback(
    (incentiveId: string) => {
      setSnapshot((prev) => {
        const next: PartnerProgramsSnapshot = {
          ...prev,
          incentives: prev.incentives.filter((p) => p.id !== incentiveId),
        };
        persistSnapshot(next);
        return next;
      });
      bump();
    },
    [bump]
  );

  const resetToSeed = useCallback(() => {
    const next = createPartnerProgramsSeedSnapshot();
    persistSnapshot(next);
    setSnapshot(next);
    bump();
  }, [bump]);

  const value = useMemo<PartnerProgramsContextValue>(
    () => ({
      snapshot,
      revision,
      upsertProgram,
      removeProgram,
      upsertLink,
      removeLink,
      upsertIncentive,
      removeIncentive,
      resetToSeed,
    }),
    [
      snapshot,
      revision,
      upsertProgram,
      removeProgram,
      upsertLink,
      removeLink,
      upsertIncentive,
      removeIncentive,
      resetToSeed,
    ]
  );

  return <PartnerProgramsContext.Provider value={value}>{children}</PartnerProgramsContext.Provider>;
}

export function usePartnerPrograms(): PartnerProgramsContextValue {
  const ctx = useContext(PartnerProgramsContext);
  if (!ctx) {
    throw new Error("usePartnerPrograms must be used within PartnerProgramsProvider");
  }
  return ctx;
}

export function usePartnerProgramsOptional(): PartnerProgramsContextValue | null {
  return useContext(PartnerProgramsContext);
}
