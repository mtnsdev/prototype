"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Citation } from "./types";

type InlineCitationMarkerProps = {
  citation: Citation;
  displayNumber: number;
  onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
  onHover?: (displayNumber: number | null) => void;
};

/** Inline citation marker: circle with number, hover = panel (excerpt + source), click = PDF modal. No native title tooltip. */
export function InlineCitationMarker({ citation, displayNumber, onCitationClick, onHover }: InlineCitationMarkerProps) {
  const [hover, setHover] = useState(false);
  const filename = citation.filename || citation.source;
  const pageNumber = citation.page_number;
  const pdf_path = citation.pdf_path;

  const handleEnter = () => {
    setHover(true);
    onHover?.(displayNumber);
  };
  const handleLeave = () => {
    setHover(false);
    onHover?.(null);
  };

  return (
    <span
      className="relative inline-flex align-baseline"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Button
        type="button"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          onCitationClick(filename, pageNumber, pdf_path);
        }}
        className={[
          "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-white text-2xs font-semibold p-1 leading-none",
          "bg-[rgba(212,165,116,0.4)] hover:bg-[rgba(212,165,116,0.6)] border border-[rgba(212,165,116,0.5)]",
          "cursor-pointer align-[0.15em] ml-1",
        ].join(" ")}
      >
        {displayNumber}
      </Button>
      {hover && (
        <>
          <span className="absolute left-0 top-full min-w-[540px] w-full h-3 z-40 block" aria-hidden style={{ width: "max(100%, 240px)" }} />
          <span
            className="absolute left-0 top-full mt-1.5 z-50 min-w-[540px] max-w-[580px] max-h-[320px] rounded-lg shadow-xl border border-input bg-accent p-4 flex flex-col"
            role="tooltip"
          >
            <span className="text-compact text-[rgba(245,245,245,0.9)] leading-relaxed whitespace-pre-wrap overflow-y-auto min-h-0 flex-1 pr-1 block">
              {citation.excerpt}
            </span>
            <span className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground/75 shrink-0 block">
              {filename}
              {pageNumber != null && ` · Page ${pageNumber}`}
            </span>
          </span>
        </>
      )}
    </span>
  );
}

type InlineCitationMarkerEllipsisProps = {
  chunkIds: string[];
  citationByChunkId: Map<string, Citation>;
  chunkIdToDisplayNumber: Map<string, number>;
  onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
};

/** Ellipsis for 3+ citations: shows "…" until clicked, then expands to show all citation circles */
export function InlineCitationMarkerEllipsis({
  chunkIds,
  citationByChunkId,
  chunkIdToDisplayNumber,
  onCitationClick,
}: InlineCitationMarkerEllipsisProps) {
  const [expanded, setExpanded] = useState(false);
  const citations = chunkIds.map((id) => citationByChunkId.get(id)).filter(Boolean) as Citation[];
  if (citations.length === 0) return null;

  if (expanded) {
    return (
      <span className="inline-flex items-center flex-nowrap gap-0 align-baseline">
        {citations.map((citation, i) => (
          <InlineCitationMarker
            key={chunkIds[i]}
            citation={citation}
            displayNumber={chunkIdToDisplayNumber.get(chunkIds[i]) ?? i + 1}
            onCitationClick={onCitationClick}
          />
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setExpanded(false);
          }}
          className={[
            "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-2xs font-semibold p-1 leading-none",
            "bg-[rgba(212,165,116,0.4)] hover:bg-[rgba(212,165,116,0.6)] text-white border border-[rgba(212,165,116,0.5)]",
            "cursor-pointer transition-colors duration-150 align-[0.15em] ml-1",
          ].join(" ")}
          title="Collapse citations"
          aria-label="Collapse citations"
        >
          ←
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setExpanded(true);
      }}
      className={[
        "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-white text-2xs font-semibold p-1 leading-none",
        "bg-[rgba(212,165,116,0.4)] hover:bg-[rgba(212,165,116,0.6)] border border-[rgba(212,165,116,0.5)]",
        "cursor-pointer transition-colors duration-150 align-[0.15em] ml-1",
      ].join(" ")}
      aria-label="Show all citations"
    >
      …
    </button>
  );
}
