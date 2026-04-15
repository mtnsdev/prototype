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
  Promotion,
} from "@/types/partner-programs";

const STORAGE_KEY = "enable_partner_programs_v2";

function stripLegacyPromotionFields(p: Record<string, unknown>): Record<string, unknown> {
  const { type: _t, status: _s, ...rest } = p;
  return rest;
}

function normalizePromotionRecord(raw: Record<string, unknown>): Promotion {
  const row = stripLegacyPromotionFields(raw);
  const createdAt = String(row.createdAt ?? new Date().toISOString());
  const createdBy = String(row.createdBy ?? "unknown");
  const updatedAt =
    typeof row.updatedAt === "string" && row.updatedAt.trim() !== "" ? row.updatedAt : createdAt;
  const updatedBy =
    typeof row.updatedBy === "string" && row.updatedBy.trim() !== "" ? row.updatedBy : createdBy;
  return { ...row, createdAt, createdBy, updatedAt, updatedBy } as unknown as Promotion;
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
      const parsed = JSON.parse(raw) as PartnerProgramsSnapshot;
      if (parsed?.programs && parsed?.links && parsed?.promotions) {
        return {
          ...parsed,
          promotions: parsed.promotions.map((pr) =>
            normalizePromotionRecord(pr as unknown as Record<string, unknown>)
          ),
        };
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const legacy = localStorage.getItem("enable_partner_programs_v1");
    if (legacy) {
      const parsed = JSON.parse(legacy) as PartnerProgramsSnapshot;
      if (parsed?.programs && parsed?.links && parsed?.promotions) {
        const migrated: PartnerProgramsSnapshot = {
          ...parsed,
          promotions: parsed.promotions.map((pr) =>
            normalizePromotionRecord(pr as unknown as Record<string, unknown>)
          ),
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } catch {
          /* ignore */
        }
        localStorage.removeItem("enable_partner_programs_v1");
        return migrated;
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
  upsertPromotion: (promotion: Promotion) => void;
  removePromotion: (promotionId: string) => void;
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
          promotions: prev.promotions.filter((pr) => pr.programId !== programId),
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

  const upsertPromotion = useCallback(
    (promotion: Promotion) => {
      setSnapshot((prev) => {
        const idx = prev.promotions.findIndex((p) => p.id === promotion.id);
        const promotions =
          idx >= 0
            ? prev.promotions.map((p, i) => (i === idx ? promotion : p))
            : [...prev.promotions, promotion];
        const next: PartnerProgramsSnapshot = { ...prev, promotions };
        persistSnapshot(next);
        return next;
      });
      bump();
    },
    [bump]
  );

  const removePromotion = useCallback(
    (promotionId: string) => {
      setSnapshot((prev) => {
        const next: PartnerProgramsSnapshot = {
          ...prev,
          promotions: prev.promotions.filter((p) => p.id !== promotionId),
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
      upsertPromotion,
      removePromotion,
      resetToSeed,
    }),
    [
      snapshot,
      revision,
      upsertProgram,
      removeProgram,
      upsertLink,
      removeLink,
      upsertPromotion,
      removePromotion,
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
