"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import {
  canManageAgencyDestinationNotes,
  canViewAgencyDestinationNotes,
} from "@/utils/destinationPermissions";
import {
  agencyDestinationNotesStorageKey,
  getAgencyDestinationNote,
  setAgencyDestinationNote,
} from "@/lib/agencyDestinationNotesStorage";
import { Button } from "@/components/ui/button";
import { destCardClass, destMuted } from "./destinationStyles";
import { cn } from "@/lib/utils";

type Props = {
  destinationSlug: string;
};

export function DestinationAgencyNotes({ destinationSlug }: Props) {
  const toast = useToast();
  const { user, isLoading } = useUser();
  const agencyId = user?.agency_id != null ? String(user.agency_id) : null;
  const liveId = useId();

  const canView = user != null && canViewAgencyDestinationNotes(user);
  const canEdit = user != null && canManageAgencyDestinationNotes(user);

  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const reloadFromStorage = useCallback(() => {
    if (!agencyId) return;
    const next = getAgencyDestinationNote(agencyId, destinationSlug);
    setText(next);
    setSavedText(next);
  }, [agencyId, destinationSlug]);

  useEffect(() => {
    if (!agencyId) {
      setText("");
      setSavedText("");
      setHydrated(true);
      return;
    }
    reloadFromStorage();
    setHydrated(true);
  }, [agencyId, destinationSlug, reloadFromStorage]);

  useEffect(() => {
    if (!agencyId || typeof window === "undefined") return;
    const key = agencyDestinationNotesStorageKey(agencyId);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue != null) reloadFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [agencyId, reloadFromStorage]);

  const dirty = text !== savedText;

  const onSave = useCallback(() => {
    if (!agencyId || !canEdit) return;
    setAgencyDestinationNote(agencyId, destinationSlug, text);
    const normalized = text.trim() === "" ? "" : text;
    setSavedText(normalized);
    setText(normalized);
    toast({
      title: "Agency notes saved",
      tone: "success",
      description: "Everyone at your agency will see this on their next visit.",
    });
    setSaveStatus("Agency notes saved.");
    window.setTimeout(() => setSaveStatus(""), 4000);
  }, [agencyId, canEdit, destinationSlug, text, toast]);

  if (isLoading || !hydrated) {
    return null;
  }

  if (!canView) {
    return (
      <div
        className={cn(destCardClass(), "mt-5 border-dashed p-3 md:p-4")}
        role="region"
        aria-label="Agency notes unavailable"
      >
        <p className={`text-sm ${destMuted}`}>
          Agency workspace notes appear here when your account is linked to an agency.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(destCardClass(), "mt-5 p-3 md:p-4")}
      role="region"
      aria-label="Agency destination notes"
    >
      <div aria-live="polite" className="sr-only" id={liveId}>
        {saveStatus}
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Agency notes</h2>
          <p className={`mt-1 text-xs ${destMuted}`}>
            Shared with everyone at your agency.{canEdit ? " Only agency leads can edit." : " Read-only for your role."}
          </p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            size="sm"
            variant="toolbarAccent"
            disabled={!dirty}
            onClick={onSave}
            className="shrink-0"
          >
            Save
          </Button>
        ) : null}
      </div>

      {canEdit ? (
        <label className="mt-3 block">
          <span className="sr-only">Agency notes for this destination</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Internal reminders, preferred suppliers, blackout context…"
            className={cn(
              "mt-1 w-full resize-y rounded-lg border border-border bg-inset px-3 py-2 text-sm leading-relaxed text-foreground",
              "placeholder:text-muted-foreground",
              "outline-none focus-visible:ring-1 focus-visible:ring-brand-cta/40",
            )}
            aria-describedby={saveStatus ? liveId : undefined}
          />
        </label>
      ) : (
        <div className="mt-3">
          {text.trim() ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{text}</p>
          ) : (
            <p className={`text-sm ${destMuted}`}>No agency notes for this destination yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
