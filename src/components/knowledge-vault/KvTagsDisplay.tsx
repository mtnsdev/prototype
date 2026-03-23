"use client";

import { Tags } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SEP = " · ";

/** Tag path copy — readable on dark rows without competing with titles */
const TEXT_PRIMARY = "text-[var(--text-tertiary)]";
const TEXT_FAINT = "text-[var(--text-quaternary)]";
const TEXT_LABEL = "text-[var(--text-quaternary)]";

type TableCellProps = {
  tags: string[];
  showEmptyDash?: boolean;
  className?: string;
};

/** Legacy narrow cell — prefer KvTagsFullWidthRow in tables */
export function KvTagsTableCell({ tags, showEmptyDash = true, className }: TableCellProps) {
  if (tags.length === 0) {
    return showEmptyDash ? (
      <span className={cn("text-[11px] tabular-nums", TEXT_FAINT, className)}>—</span>
    ) : null;
  }

  const joined = tags.join(SEP);
  const titleHover = tags.join(" → ");

  return (
    <div className={cn("flex items-center gap-1.5 min-w-0 max-w-[min(280px,34vw)]", className)}>
      <span className={cn("text-[11px] truncate min-w-0 flex-1 leading-snug", TEXT_PRIMARY)} title={titleHover}>
        {joined}
      </span>
      <TagOverflowMenu tags={tags} />
    </div>
  );
}

type FullRowProps = {
  tags: string[];
  emailLike?: boolean;
  className?: string;
};

/**
 * Full table row width: label + path (wraps) + overflow menu. Use inside <td colSpan={…}>.
 * Prefer {@link KvTagsTitleSubline} under the title to avoid an extra table row.
 */
export function KvTagsFullWidthRow({ tags, emailLike, className }: FullRowProps) {
  if (emailLike) {
    return (
      <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1 w-full min-w-0", className)}>
        <span className={cn("text-[10px] font-medium uppercase tracking-wider shrink-0", TEXT_LABEL)}>Tags</span>
        <span className={cn("text-[11px]", TEXT_FAINT)}>—</span>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1 w-full min-w-0", className)}>
        <span className={cn("text-[10px] font-medium uppercase tracking-wider shrink-0", TEXT_LABEL)}>Tags</span>
        <span className={cn("text-[11px]", TEXT_FAINT)}>—</span>
      </div>
    );
  }

  const joined = tags.join(SEP);
  const titleHover = tags.join(" → ");

  return (
    <div className={cn("flex flex-wrap items-start gap-x-3 gap-y-1 w-full min-w-0", className)}>
      <span className={cn("text-[10px] font-medium uppercase tracking-wider shrink-0 pt-0.5", TEXT_LABEL)}>
        Tags
      </span>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <p
          className={cn("text-[11px] leading-relaxed min-w-0 flex-1 break-words", TEXT_PRIMARY)}
          title={titleHover}
        >
          {joined}
        </p>
        <TagOverflowMenu tags={tags} />
      </div>
    </div>
  );
}

/**
 * Single-line tags under the document title (list + grid). Saves a full table row per document.
 */
export function KvTagsTitleSubline({ tags, emailLike, className }: FullRowProps) {
  if (emailLike) {
    return (
      <div className={cn("mt-1 flex min-w-0 items-center gap-2 text-[10px] leading-tight", className)}>
        <span className={cn("shrink-0 font-medium uppercase tracking-wider", TEXT_LABEL)}>Tags</span>
        <span className={TEXT_FAINT}>—</span>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className={cn("mt-1 flex min-w-0 items-center gap-2 text-[10px] leading-tight", className)}>
        <span className={cn("shrink-0 font-medium uppercase tracking-wider", TEXT_LABEL)}>Tags</span>
        <span className={TEXT_FAINT}>—</span>
      </div>
    );
  }

  const joined = tags.join(SEP);
  return (
    <div className={cn("mt-1 flex min-w-0 items-center gap-2 text-[10px] leading-tight", className)}>
      <span className={cn("shrink-0 font-medium uppercase tracking-wider", TEXT_LABEL)}>Tags</span>
      <span className={cn("min-w-0 truncate", TEXT_PRIMARY)} title={tags.join(" → ")}>
        {joined}
      </span>
      <TagOverflowMenu tags={tags} />
    </div>
  );
}

function TagOverflowMenu({ tags }: { tags: string[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "shrink-0 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] tabular-nums transition-colors",
            "text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)]",
            "bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05]"
          )}
          aria-label={`View all ${tags.length} tag${tags.length === 1 ? "" : "s"}`}
        >
          <Tags size={11} className="opacity-50" aria-hidden />
          {tags.length}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="min-w-[220px] max-w-[min(320px,90vw)] bg-[#111111] border-white/[0.06] p-0 overflow-hidden shadow-lg"
      >
        <div
          className={cn(
            "px-3 py-2 text-[10px] font-medium uppercase tracking-wider border-b border-white/[0.04]",
            TEXT_LABEL
          )}
        >
          Tags ({tags.length})
        </div>
        <ul className="max-h-48 overflow-y-auto overscroll-contain py-1.5 px-2 space-y-0.5">
          {tags.map((t) => (
            <li
              key={t}
              className={cn(
                "text-[11px] pl-2 py-1 border-l border-white/[0.06] leading-snug break-words",
                TEXT_PRIMARY
              )}
            >
              {t}
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type InlineProps = {
  tags: string[];
  className?: string;
};

export function KvTagsInline({ tags, className }: InlineProps) {
  if (tags.length === 0) return null;
  const joined = tags.join(SEP);
  return (
    <p
      className={cn("text-[10px] truncate leading-snug", TEXT_PRIMARY, className)}
      title={tags.join(" → ")}
    >
      {joined}
    </p>
  );
}

type DetailProps = {
  tags: string[];
  className?: string;
};

export function KvTagsDetailList({ tags, className }: DetailProps) {
  if (tags.length === 0) return null;
  return (
    <ul
      className={cn(
        "max-h-28 overflow-y-auto overscroll-contain rounded-md border border-white/[0.04] bg-white/[0.015] px-2 py-1.5",
        className
      )}
    >
      {tags.map((t) => (
        <li
          key={t}
          className={cn(
            "text-[11px] pl-2 py-0.5 border-l border-white/[0.06] leading-snug break-words",
            TEXT_PRIMARY
          )}
        >
          {t}
        </li>
      ))}
    </ul>
  );
}
