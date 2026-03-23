"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_EMAIL_INGESTIONS } from "@/components/knowledge-vault/emailIngestionMock";
import type { EmailAttachment, EmailIngestion } from "@/types/email-ingestion";

function cloneEmails(src: typeof MOCK_EMAIL_INGESTIONS): EmailIngestion[] {
  return src.map((e) => ({
    ...e,
    tags: [...e.tags],
    attachments: e.attachments.map((a) => ({
      ...a,
      parentEmailId: e.id,
      tags: [...(a.tags ?? [])],
    })),
  }));
}

type KnowledgeVaultEmailContextValue = {
  emails: EmailIngestion[];
  unprocessedCount: number;
  shareEmailWithTeam: (id: string, teamId: string) => void;
  shareAttachmentWithTeam: (attachmentId: string, teamId: string) => void;
  markEmailProcessed: (id: string) => void;
  addEmailTag: (emailId: string, tag: string) => void;
  removeEmailTag: (emailId: string, tag: string) => void;
  addAttachmentTag: (emailId: string, attachmentId: string, tag: string) => void;
  removeAttachmentTag: (emailId: string, attachmentId: string, tag: string) => void;
};

const KnowledgeVaultEmailContext = createContext<KnowledgeVaultEmailContextValue | null>(null);

function initialEmails(): EmailIngestion[] {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_KV_EMAIL_EMPTY === "1") {
    return [];
  }
  return cloneEmails(MOCK_EMAIL_INGESTIONS);
}

export function KnowledgeVaultEmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailIngestion[]>(initialEmails);

  const unprocessedCount = useMemo(() => emails.filter((e) => e.status === "unprocessed").length, [emails]);

  const shareEmailWithTeam = useCallback((id: string, teamId: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, scope: teamId } : e)));
  }, []);

  const shareAttachmentWithTeam = useCallback((attachmentId: string, teamId: string) => {
    setEmails((prev) =>
      prev.map((e) => ({
        ...e,
        attachments: e.attachments.map((a) =>
          a.id === attachmentId ? { ...a, scope: teamId } : a
        ),
      }))
    );
  }, []);

  const markEmailProcessed = useCallback((id: string) => {
    const now = new Date().toISOString();
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "processed" as const,
              processedAt: now,
              tags: e.tags.filter((t) => t !== "unprocessed"),
            }
          : e
      )
    );
  }, []);

  const addEmailTag = useCallback((emailId: string, tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    setEmails((prev) =>
      prev.map((e) =>
        e.id === emailId && !e.tags.some((x) => x.toLowerCase() === t)
          ? { ...e, tags: [...e.tags, t] }
          : e
      )
    );
  }, []);

  const removeEmailTag = useCallback((emailId: string, tag: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, tags: e.tags.filter((x) => x !== tag) } : e))
    );
  }, []);

  const addAttachmentTag = useCallback((emailId: string, attachmentId: string, tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id !== emailId) return e;
        return {
          ...e,
          attachments: e.attachments.map((a) => {
            if (a.id !== attachmentId) return a;
            const cur = a.tags ?? [];
            if (cur.some((x) => x.toLowerCase() === t)) return a;
            return { ...a, tags: [...cur, t] };
          }),
        };
      })
    );
  }, []);

  const removeAttachmentTag = useCallback((emailId: string, attachmentId: string, tag: string) => {
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id !== emailId) return e;
        return {
          ...e,
          attachments: e.attachments.map((a) =>
            a.id === attachmentId ? { ...a, tags: (a.tags ?? []).filter((x) => x !== tag) } : a
          ),
        };
      })
    );
  }, []);

  const value = useMemo(
    () => ({
      emails,
      unprocessedCount,
      shareEmailWithTeam,
      shareAttachmentWithTeam,
      markEmailProcessed,
      addEmailTag,
      removeEmailTag,
      addAttachmentTag,
      removeAttachmentTag,
    }),
    [
      emails,
      unprocessedCount,
      shareEmailWithTeam,
      shareAttachmentWithTeam,
      markEmailProcessed,
      addEmailTag,
      removeEmailTag,
      addAttachmentTag,
      removeAttachmentTag,
    ]
  );

  return (
    <KnowledgeVaultEmailContext.Provider value={value}>{children}</KnowledgeVaultEmailContext.Provider>
  );
}

export function useKnowledgeVaultEmails(): KnowledgeVaultEmailContextValue {
  const v = useContext(KnowledgeVaultEmailContext);
  if (!v) throw new Error("KnowledgeVaultEmailProvider is required");
  return v;
}
