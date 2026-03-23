"use client";

import { useCallback, useMemo, useState } from "react";
import { Award, ChevronDown, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import type { Product } from "@/types/product";
import {
  getProductLayerMock,
  type AgencyNoteMock,
  type AdvisorLayerMock,
  type PartnerProgramMock,
} from "./productLayerMock";

type Props = {
  product: Product;
};

export function ProductDetailLayers({ product }: Props) {
  const { user } = useUser();
  const toast = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "agency_admin";

  const mock = useMemo(() => getProductLayerMock(product.id), [product.id]);
  const [notesOpen, setNotesOpen] = useState(true);
  const [activeNoteLayer, setActiveNoteLayer] = useState<"private" | "team">("private");
  const [advisorOverrides, setAdvisorOverrides] = useState<AdvisorLayerMock>(mock.advisorDefaults);
  const [agencyNotes, setAgencyNotes] = useState<AgencyNoteMock[]>(mock.agencyNotes);
  const [newAgencyNote, setNewAgencyNote] = useState("");
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionReason, setSuggestionReason] = useState("Star rating is inaccurate");
  const [suggestionDetails, setSuggestionDetails] = useState("");
  const [suggestionScope, setSuggestionScope] = useState<"agency" | "enable">("agency");

  const submitAgencyNote = useCallback(() => {
    const t = newAgencyNote.trim();
    if (!t) return;
    const author = user?.username ?? user?.email ?? "You";
    setAgencyNotes((prev) => [
      {
        id: `an-${Date.now()}`,
        content: t,
        author,
        timeAgo: "Just now",
      },
      ...prev,
    ]);
    setNewAgencyNote("");
  }, [newAgencyNote, user?.username, user?.email]);

  const ownership = product.data_ownership_level ?? "Enable";
  const showLockBanner = !isAdmin && ownership !== "Advisor";
  const showSuggestChange = !isAdmin && (ownership === "Enable" || ownership === "Agency");

  return (
    <>
      {showLockBanner && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mb-3">
          <Lock className="w-3 h-3 shrink-0" />
          <span>
            Team record — view only. You can add personal notes or suggest changes.
          </span>
        </div>
      )}

      {showSuggestChange && (
        <button
          type="button"
          onClick={() => setShowSuggestionModal(true)}
          className="text-[10px] text-blue-400/70 hover:text-blue-400 underline decoration-blue-400/20 mb-4 block text-left"
        >
          Suggest a change
        </button>
      )}

      {/* Notes & Details — collapsible */}
      <div className="border-t border-white/[0.06] pt-5 mt-5">
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          className="flex w-full items-center justify-between mb-4 text-left"
        >
          <span className="text-sm font-medium text-white">Notes & Details</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform",
              notesOpen && "rotate-180"
            )}
          />
        </button>

        {notesOpen && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="sr-only">Layer</span>
              <div className="flex items-center gap-1 bg-white/[0.03] rounded-full p-0.5 ml-auto">
                {(["private", "team"] as const).map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => setActiveNoteLayer(layer)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-medium transition-all",
                      activeNoteLayer === layer
                        ? layer === "private"
                          ? "bg-violet-500/15 text-violet-400"
                          : "bg-blue-500/15 text-blue-400"
                        : "text-gray-500 hover:text-gray-400"
                    )}
                  >
                    {layer === "private" ? "My Notes" : "Team Notes"}
                  </button>
                ))}
              </div>
            </div>

            {activeNoteLayer === "private" && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lock className="w-3 h-3 text-violet-400/50" />
                  <span className="text-[10px] text-violet-400/60">Only visible to you</span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                    My Contact
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Sarah at front desk — sarah@hotel.com"
                    value={advisorOverrides.contact}
                    onChange={(e) =>
                      setAdvisorOverrides({ ...advisorOverrides, contact: e.target.value })
                    }
                    className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 placeholder:text-gray-600 outline-none"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                    My Notes
                  </p>
                  <textarea
                    placeholder="Your personal notes about this property..."
                    value={advisorOverrides.notes}
                    onChange={(e) =>
                      setAdvisorOverrides({ ...advisorOverrides, notes: e.target.value })
                    }
                    className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 placeholder:text-gray-600 outline-none resize-none h-20 leading-relaxed"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                    My Rating
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setAdvisorOverrides({ ...advisorOverrides, personalRating: star })
                        }
                        className={cn(
                          "w-5 h-5 text-xs",
                          star <= (advisorOverrides.personalRating || 0)
                            ? "text-amber-400"
                            : "text-gray-700"
                        )}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-[10px] text-gray-600 ml-2">
                      {advisorOverrides.personalRating
                        ? `${advisorOverrides.personalRating}/5`
                        : "Not rated"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeNoteLayer === "team" && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3 h-3 text-blue-400/50" />
                  <span className="text-[10px] text-blue-400/60">Visible to all team members</span>
                </div>
                <div className="space-y-2">
                  {agencyNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-gray-300 leading-relaxed flex-1">
                          {note.content}
                        </p>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              toast("Suggestion review — coming in v2")
                            }
                            className="text-[10px] text-amber-400/80 shrink-0 hover:text-amber-400"
                          >
                            Pin
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-500">{note.author}</span>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-[10px] text-gray-600">{note.timeAgo}</span>
                        {note.pinned && (
                          <span className="text-[10px] text-amber-500/80 ml-1">· Pinned</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a note for the team..."
                    value={newAgencyNote}
                    onChange={(e) => setNewAgencyNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitAgencyNote()}
                    className="flex-1 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 placeholder:text-gray-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={submitAgencyNote}
                    className="text-xs text-blue-400 hover:text-blue-300 px-3"
                  >
                    Post
                  </button>
                </div>
                {!isAdmin && (
                  <p className="text-[10px] text-gray-600 italic">
                    Team-level fields (description, star rating, etc.) can only be changed by an
                    admin. You can suggest a change below.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Partner Programs */}
      <PartnerProgramsSection programs={mock.partnerPrograms} />

      {showSuggestionModal && (
        <SuggestionModal
          reason={suggestionReason}
          setReason={setSuggestionReason}
          details={suggestionDetails}
          setDetails={setSuggestionDetails}
          scope={suggestionScope}
          setScope={setSuggestionScope}
          onClose={() => setShowSuggestionModal(false)}
          onSubmit={() => {
            toast("Suggestion submitted — Kristin will review it");
            setShowSuggestionModal(false);
          }}
        />
      )}
    </>
  );
}

function PartnerProgramsSection({ programs }: { programs: PartnerProgramMock[] }) {
  return (
    <div className="border-t border-white/[0.06] pt-5 mt-5">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-white">Partner Programs</span>
        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
          {programs.length}
        </span>
      </div>
      {programs.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">
          No partner programs linked to this product
        </p>
      ) : (
        <div className="space-y-2">
          {programs.map((program) => (
            <div
              key={program.id}
              className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04] flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-white">{program.name}</span>
                  {program.scope === "enable" ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      Enable
                    </span>
                  ) : (
                    <ScopeBadge scope={program.scope} teams={MOCK_TEAMS} />
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{program.benefits}</p>
                {program.commission && (
                  <p className="text-[10px] text-amber-400/70 mt-0.5">
                    Commission: {program.commission}
                  </p>
                )}
                {program.commissionContact && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Commission contact: {program.commissionContact.name} — {program.commissionContact.email}
                  </p>
                )}
                {program.expires && (
                  <p className="text-[10px] text-gray-600 mt-0.5">Expires: {program.expires}</p>
                )}
              </div>
              <button
                type="button"
                className="text-[10px] text-gray-600 hover:text-gray-400 shrink-0"
              >
                Details →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionModal({
  reason,
  setReason,
  details,
  setDetails,
  scope,
  setScope,
  onClose,
  onSubmit,
}: {
  reason: string;
  setReason: (v: string) => void;
  details: string;
  setDetails: (v: string) => void;
  scope: "agency" | "enable";
  setScope: (v: "agency" | "enable") => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggest-change-title"
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 w-full max-w-[400px] shadow-2xl">
        <h3 id="suggest-change-title" className="text-sm font-medium text-white mb-3">
          Suggest a Change
        </h3>
        <p className="text-[10px] text-gray-500 mb-4">
          Your suggestion will be reviewed by an agency admin before it&apos;s applied.
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
              What should change?
            </p>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
            >
              <option>Star rating is inaccurate</option>
              <option>Price range is wrong</option>
              <option>Description needs updating</option>
              <option>Contact info is outdated</option>
              <option>Category is incorrect</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Details</p>
            <textarea
              placeholder="Describe what should be changed and why..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 placeholder:text-gray-600 outline-none resize-none h-20 leading-relaxed"
            />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Apply to</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScope("agency")}
                className={cn(
                  "text-[10px] px-3 py-1 rounded-full border",
                  scope === "agency"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-white/5 text-gray-500 border-white/[0.06]"
                )}
              >
                Agency level
              </button>
              <button
                type="button"
                onClick={() => setScope("enable")}
                className={cn(
                  "text-[10px] px-3 py-1 rounded-full border",
                  scope === "enable"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-white/5 text-gray-500 border-white/[0.06]"
                )}
              >
                Enable level
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-400 px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-3 py-1.5 rounded-lg font-medium"
          >
            Submit Suggestion
          </button>
        </div>
      </div>
    </div>
  );
}
