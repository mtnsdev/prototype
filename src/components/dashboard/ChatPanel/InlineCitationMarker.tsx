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

/** Inline citation marker: circle with number, click = PDF modal (no hover tooltip) */
export function InlineCitationMarker({ citation, displayNumber, onCitationClick, onHover }: InlineCitationMarkerProps) {
  const filename = citation.filename || citation.source;
  const pageNumber = citation.page_number;
  const pdf_path = citation.pdf_path;

  const handleEnter = () => onHover?.(displayNumber);
  const handleLeave = () => onHover?.(null);

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
          "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-white text-[10px] font-semibold p-1 leading-none",
          "bg-[rgba(212,165,116,0.4)] hover:bg-[rgba(212,165,116,0.6)] border border-[rgba(212,165,116,0.5)]",
          "cursor-pointer align-[0.15em] ml-1",
        ].join(" ")}
      >
        {displayNumber}
      </Button>
    </span>
  );
}

type InlineCitationMarkerEllipsisProps = {
  chunkIds: string[];
  citationByChunkId: Map<string, Citation>;
  chunkIdToDisplayNumber: Map<string, number>;
  onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
};

/** Ellipsis for 3+ citations: shows "..." until clicked, then expands to show all citation circles */
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
            "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-[10px] font-semibold p-1 leading-none",
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
        "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-white text-[10px] font-semibold p-1 leading-none",
        "bg-[rgba(212,165,116,0.4)] hover:bg-[rgba(212,165,116,0.6)] border border-[rgba(212,165,116,0.5)]",
        "cursor-pointer transition-colors duration-150 align-[0.15em] ml-1",
      ].join(" ")}
      aria-label="Show all citations"
    >
      …
    </button>
  );
}
