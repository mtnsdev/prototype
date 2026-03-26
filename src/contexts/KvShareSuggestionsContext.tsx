"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type KvShareSuggestion = {
  id: string;
  docId: string;
  docTitle: string;
  teamId: string;
  teamName: string;
};

type ApprovalHandler = (docId: string, teamId: string) => void;

type KvShareSuggestionsContextValue = {
  suggestions: KvShareSuggestion[];
  addSuggestion: (item: Omit<KvShareSuggestion, "id">) => void;
  addSuggestions: (items: Omit<KvShareSuggestion, "id">[]) => void;
  approve: (id: string) => void;
  decline: (id: string) => void;
  setApprovalHandler: (fn: ApprovalHandler | null) => void;
};

const KvShareSuggestionsContext = createContext<KvShareSuggestionsContextValue | null>(null);

export function KvShareSuggestionsProvider({ children }: { children: ReactNode }) {
  const [suggestions, setSuggestions] = useState<KvShareSuggestion[]>([]);
  const approvalRef = useRef<ApprovalHandler | null>(null);

  const addSuggestion = useCallback((item: Omit<KvShareSuggestion, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setSuggestions((prev) => [...prev, { ...item, id }]);
  }, []);

  const addSuggestions = useCallback((items: Omit<KvShareSuggestion, "id">[]) => {
    if (items.length === 0) return;
    const base = Date.now();
    setSuggestions((prev) => [
      ...prev,
      ...items.map((item, i) => ({
        ...item,
        id: `${base}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      })),
    ]);
  }, []);

  const approve = useCallback((id: string) => {
    setSuggestions((prev) => {
      const s = prev.find((x) => x.id === id);
      if (s) approvalRef.current?.(s.docId, s.teamId);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const decline = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const setApprovalHandler = useCallback((fn: ApprovalHandler | null) => {
    approvalRef.current = fn;
  }, []);

  const value = useMemo(
    () => ({
      suggestions,
      addSuggestion,
      addSuggestions,
      approve,
      decline,
      setApprovalHandler,
    }),
    [suggestions, addSuggestion, addSuggestions, approve, decline, setApprovalHandler]
  );

  return (
    <KvShareSuggestionsContext.Provider value={value}>{children}</KvShareSuggestionsContext.Provider>
  );
}

export function useKvShareSuggestions(): KvShareSuggestionsContextValue {
  const ctx = useContext(KvShareSuggestionsContext);
  if (!ctx) {
    throw new Error("useKvShareSuggestions must be used within KvShareSuggestionsProvider");
  }
  return ctx;
}

export function useKvShareSuggestionsOptional(): KvShareSuggestionsContextValue | null {
  return useContext(KvShareSuggestionsContext);
}
