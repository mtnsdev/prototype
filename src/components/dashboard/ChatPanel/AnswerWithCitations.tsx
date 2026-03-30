"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { ExternalLink } from "lucide-react";
import { InlineCitationMarker } from "./InlineCitationMarker";
import type { Citation } from "./types";

const citationBlockPattern = /\[\^([^\]]+)\]/gi;

function parseCitationIds(inner: string): string[] {
  return inner
    .split(",")
    .map((s) => s.trim().replace(/^\^/, "").trim().toLowerCase())
    .filter((id) => /^[a-f0-9-]{36}$/.test(id));
}

/** Returns citations in display order (1-based index matches inline ①②③). */
export function getOrderedCitations(answer: string, citations: Citation[]): Citation[] {
  const citationByChunkId = new Map<string, Citation>(
    (citations || []).filter((c): c is Citation & { chunk_id: string } => !!c.chunk_id).map((c) => [c.chunk_id!.toLowerCase(), c])
  );
  const orderedChunkIds: string[] = [];
  const seen = new Set<string>();
  let match;
  citationBlockPattern.lastIndex = 0;
  while ((match = citationBlockPattern.exec(answer)) !== null) {
    const ids = parseCitationIds(match[1]);
    for (const id of ids) {
      if (!seen.has(id) && citationByChunkId.has(id)) {
        seen.add(id);
        orderedChunkIds.push(id);
      }
    }
  }
  return orderedChunkIds.map((id) => citationByChunkId.get(id)!).filter(Boolean);
}

const markdownComponentsBase = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3 text-foreground/90 leading-relaxed">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-outside pl-6 mb-3 space-y-1.5 text-foreground/90">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-outside pl-6 mb-3 space-y-1.5 text-foreground/90">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="pl-1 text-foreground/90 [&>p]:inline [&>p]:my-0">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-foreground font-semibold text-lg mb-2">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-foreground font-semibold text-base mb-2">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-foreground font-semibold text-sm mb-2">{children}</h3>,
};

type AnswerWithCitationsProps = {
  answer: string;
  citations: Citation[];
  onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
  onCitationHover?: (displayNumber: number | null) => void;
  onOpenKnowledgePanel?: () => void;
};

/** Renders answer text with inline citation markers (new [^chunk_id] format and legacy [Source: ..., Page: ...] format). */
export function AnswerWithCitations({
  answer,
  citations,
  onCitationClick,
  onCitationHover,
}: AnswerWithCitationsProps) {
  const citationByChunkId = new Map<string, Citation>(
    (citations || []).filter((c): c is Citation & { chunk_id: string } => !!c.chunk_id).map((c) => [c.chunk_id!.toLowerCase(), c])
  );

  const allMatches: { index: number; ids: string[] }[] = [];
  const pattern = /\[\^([^\]]+)\]/gi;
  let match;
  while ((match = pattern.exec(answer)) !== null) {
    const ids = parseCitationIds(match[1]);
    if (ids.length > 0) allMatches.push({ index: match.index, ids });
  }

  if (allMatches.length > 0 && citationByChunkId.size > 0) {
    const orderedChunkIds: string[] = [];
    const seen = new Set<string>();
    for (const { ids } of allMatches) {
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.add(id);
          orderedChunkIds.push(id);
        }
      }
    }
    const chunkIdToDisplayNumber = new Map<string, number>();
    orderedChunkIds.forEach((id, idx) => chunkIdToDisplayNumber.set(id, idx + 1));

    const answerWithLinks = answer.replace(citationBlockPattern, (_, inner) => {
      const ids = parseCitationIds(inner).filter((id) => citationByChunkId.has(id));
      if (ids.length === 0) return "";
      if (ids.length === 1) {
        const num = chunkIdToDisplayNumber.get(ids[0]) ?? 0;
        return num ? `[${num}](#citation:${ids[0]})` : "";
      }
      if (ids.length === 2) {
        const n1 = chunkIdToDisplayNumber.get(ids[0]) ?? 0;
        const n2 = chunkIdToDisplayNumber.get(ids[1]) ?? 0;
        if (!n1 || !n2) return "";
        return `[${n1}](#citation:${ids[0]})[${n2}](#citation:${ids[1]})`;
      }
      const firstNum = chunkIdToDisplayNumber.get(ids[0]) ?? 0;
      if (!firstNum) return "";
      return `[${firstNum} …](#citation-group:${ids.join(";")})`;
    });

    const blockMarkdownComponents = {
      ...markdownComponentsBase,
      a: ({ href, children: linkChildren }: { href?: string; children?: React.ReactNode }) => {
        if (href?.startsWith("#citation-group:")) {
          const payload = href.slice("#citation-group:".length);
          const allIds = payload.split(";").map((id) => id.trim().toLowerCase()).filter(Boolean);
          if (allIds.length >= 2) {
            const markers = allIds
              .map((id) => {
                const citation = citationByChunkId.get(id);
                const displayNumber = chunkIdToDisplayNumber.get(id);
                if (citation == null || displayNumber == null) return null;
                return (
                  <InlineCitationMarker
                    key={id}
                    citation={citation}
                    displayNumber={displayNumber}
                    onCitationClick={onCitationClick}
                    onHover={onCitationHover}
                  />
                );
              })
              .filter(Boolean);
            if (markers.length > 0) {
              return (
                <span className="inline-flex items-center flex-nowrap align-baseline gap-0">
                  {markers}
                </span>
              );
            }
          }
        }
        if (href?.startsWith("#citation:")) {
          const chunkId = href.slice("#citation:".length).toLowerCase();
          const citation = citationByChunkId.get(chunkId);
          const displayNumber = chunkIdToDisplayNumber.get(chunkId) ?? 0;
          if (citation) {
            return (
              <InlineCitationMarker
                citation={citation}
                displayNumber={displayNumber}
                onCitationClick={onCitationClick}
                onHover={onCitationHover}
              />
            );
          }
        }
        return <a href={href}>{linkChildren}</a>;
      },
    };

    return (
      <ReactMarkdown components={blockMarkdownComponents}>
        {answerWithLinks}
      </ReactMarkdown>
    );
  }

  // Legacy format: [Source: filename, Page: 1] or [Source: filename, Pages: 1, 24, 25, 27]
  const citationPattern = /\[Source:\s*([^,\]]+),\s*Pages?:\s*([^\]]+)\]/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let legacyMatch;
  let citationIndex = 0;
  citationPattern.lastIndex = 0;

  while ((legacyMatch = citationPattern.exec(answer)) !== null) {
    if (legacyMatch.index > lastIndex) {
      const textBefore = answer.substring(lastIndex, legacyMatch.index);
      if (textBefore) parts.push(textBefore);
    }

    const filename = legacyMatch[1].trim();
    const pageNumbersStr = legacyMatch[2].trim();
    const pageNumbers = pageNumbersStr.split(",").map((p) => p.trim()).filter(Boolean);

    const matchingCitation = citations.find(
      (c) => (c.filename || c.source) === filename || (c.filename || c.source)?.toLowerCase() === filename.toLowerCase()
    );
    const pdfPath = matchingCitation?.pdf_path;

    parts.push(
      <span key={`citation-group-${citationIndex++}`} className="inline-flex items-center gap-1 ml-1.5">
        <span className="text-muted-foreground/55 text-xs">[</span>
        <span className="text-muted-foreground text-xs font-medium truncate max-w-30" title={filename}>
          {filename}
        </span>
        <span className="text-muted-foreground/55 text-xs">:</span>
        {pageNumbers.map((pageNum, pageIdx) => (
          <React.Fragment key={`page-${pageIdx}`}>
            <button
              onClick={() => onCitationClick(filename, pageNum, pdfPath)}
              className="text-[var(--color-warning)] hover:text-[#E5B87A] hover:bg-[rgba(212,165,116,0.12)] px-1.5 py-0.5 rounded-md cursor-pointer transition-all duration-150 inline-flex items-center gap-1 text-xs font-semibold border border-[rgba(212,165,116,0.3)] hover:border-[rgba(212,165,116,0.5)]"
              title={`View ${filename} page ${pageNum}`}
            >
              {pageNum}
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
            {pageIdx < pageNumbers.length - 1 && <span className="text-[rgba(245,245,245,0.3)] text-xs mx-0.5">,</span>}
          </React.Fragment>
        ))}
        <span className="text-muted-foreground/55 text-xs">]</span>
      </span>
    );

    lastIndex = citationPattern.lastIndex;
  }

  if (lastIndex < answer.length) {
    const textAfter = answer.substring(lastIndex);
    if (textAfter) parts.push(textAfter);
  }

  if (parts.length === 0 || (parts.length === 1 && typeof parts[0] === "string")) {
    return (
      <ReactMarkdown components={markdownComponentsBase}>
        {answer}
      </ReactMarkdown>
    );
  }

  return (
    <>
      {parts.map((part, idx) => {
        if (React.isValidElement(part)) {
          return <React.Fragment key={`citation-${idx}`}>{part}</React.Fragment>;
        }
        const textPart = String(part);
        if (!textPart.trim()) return null;
        return (
          <ReactMarkdown key={`text-${idx}`} components={markdownComponentsBase}>
            {textPart}
          </ReactMarkdown>
        );
      })}
    </>
  );
}
