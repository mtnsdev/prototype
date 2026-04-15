"use client";

import React from "react";
import { X, Globe, ExternalLink, MapPin, FileText, FolderPlus } from "lucide-react";
import { StarRating } from "./StarRating";
import type { PlaceCard, WebCitation, Citation } from "./types";
import { mapGooglePlaceTypesToDirectoryCategories } from "@/lib/googlePlacesToDirectoryCategories";
import { directoryCategoryLabel } from "@/components/products/productDirectoryProductTypes";
import {
  dmcOperationalDataPresent,
  isDMCProduct,
} from "@/components/products/directoryProductTypeHelpers";
import { getDirectoryProductById } from "@/components/products/productDirectoryMock";

type RightPanelProps = {
  isOpen: boolean;
  mode: "places" | "sources" | "knowledge" | null;
  placeCards: PlaceCard[];
  webCitations: WebCitation[];
  kbCitations?: Citation[];
  onClose: () => void;
  onCitationClick?: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
  highlightedKbCitationNumber?: number | null;
  /** When true and a card has `directory_product_id`, show save-to-directory control. */
  externalSearchActive?: boolean;
  onSavePlaceToExternalSearch?: (directoryProductId: string) => void;
};

export function RightPanel({
  isOpen,
  mode,
  placeCards,
  webCitations,
  kbCitations = [],
  onClose,
  onCitationClick,
  highlightedKbCitationNumber = null,
  externalSearchActive = false,
  onSavePlaceToExternalSearch,
}: RightPanelProps) {
  const panelTitle =
    mode === "sources" ? "Web sources" : mode === "knowledge" ? "Knowledge Sources" : "Places";
  const panelCount =
    mode === "sources"
      ? webCitations.length
      : mode === "knowledge"
        ? kbCitations.length
        : placeCards.length;
  const ariaLabel =
    mode === "sources" ? "Web sources panel" : mode === "knowledge" ? "Knowledge sources panel" : "Places panel";

  return (
    <aside
      className={[
        "shrink-0 overflow-hidden border-border bg-background ease-out",
        "w-full border-t lg:border-t-0 lg:border-l",
        "max-h-[38vh] lg:max-h-none",
        isOpen ? "lg:w-[420px] xl:w-[460px] min-w-0" : "w-0 min-w-0 lg:w-0 border-l-0",
      ].join(" ")}
      style={{ transition: "width 350ms ease-out" }}
      aria-hidden={!isOpen}
      aria-label={ariaLabel}
    >
      <div className="h-full flex flex-col">
        <div className="shrink-0 px-5 py-4 border-b border-border flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">{panelTitle}</h3>
            <p className="text-sm text-muted-foreground/75 mt-0.5">
              {panelCount} result{panelCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5" style={{ minHeight: 0 }}>
          {mode === "knowledge" && (
            <div className="grid grid-cols-1 gap-3">
              {kbCitations.map((cit, idx) => {
                const displayNum = idx + 1;
                const isHighlighted = highlightedKbCitationNumber === displayNum;
                const filename = cit.filename || cit.source || "Document";
                const sourceLabel = cit.source_label || "Knowledge base";
                const pageRef =
                  cit.page_number != null ? `Page ${cit.page_number}` : null;
                const excerpt = (cit.excerpt || "").slice(0, 120);
                return (
                  <button
                    key={cit.chunk_id ?? idx}
                    type="button"
                    onClick={() => onCitationClick?.(filename, cit.page_number ?? 1, cit.pdf_path)}
                    className={[
                      "w-full text-left bg-card border rounded-xl p-3 transition-colors",
                      isHighlighted
                        ? "border-[rgba(174,133,80,0.6)] bg-[rgba(174,133,80,0.08)]"
                        : "border-input hover:border-[rgba(174,133,80,0.3)]",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 shrink-0 rounded bg-[rgba(255,255,255,0.08)] flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground/75" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xs font-semibold text-[rgba(212,165,116,0.95)]">
                            {displayNum}
                          </span>
                          <span className="font-semibold text-compact leading-snug text-foreground truncate block">
                            {filename}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{sourceLabel}</p>
                        {pageRef && (
                          <p className="text-xs text-muted-foreground/75 mt-1">{pageRef}</p>
                        )}
                        {excerpt && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {excerpt}
                            {excerpt.length >= 120 ? "…" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {mode === "sources" && (
            <div className="grid grid-cols-1 gap-3">
              {webCitations.map((wc, idx) => (
                <div
                  key={`${wc.url}-${idx}`}
                  className="bg-card border border-input rounded-xl p-3 hover:border-[rgba(174,133,80,0.3)] transition-colors relative group"
                >
                  <div className="flex items-start gap-3">
                    {wc.favicon ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={wc.favicon}
                        alt=""
                        className="w-8 h-8 shrink-0 rounded object-contain"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="w-8 h-8 shrink-0 rounded bg-[rgba(255,255,255,0.08)] flex items-center justify-center">
                        <Globe className="w-4 h-4 text-muted-foreground/75" aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <a
                        href={wc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-compact leading-snug line-clamp-2 text-foreground hover:text-[var(--color-warning)] hover:underline block"
                      >
                        {wc.title || wc.url || "Web source"}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {mode === "places" && (
            <div className="grid grid-cols-1 gap-3">
              {placeCards.map((card, idx) => {
                const linkedDirectoryProduct =
                  card.directory_product_id != null && card.directory_product_id !== ""
                    ? getDirectoryProductById(card.directory_product_id)
                    : undefined;
                const showDmcOperationsOnFile =
                  linkedDirectoryProduct != null &&
                  isDMCProduct(linkedDirectoryProduct) &&
                  dmcOperationalDataPresent(linkedDirectoryProduct);
                const placeUrl = card.google_maps_url || card.website || null;
                const placeType =
                  card.google_types?.[0] != null && card.google_types[0] !== ""
                    ? card.google_types[0].charAt(0).toUpperCase() + card.google_types[0].slice(1).toLowerCase().replace(/_/g, " ")
                    : null;
                const directoryCategories = card.google_types?.length
                  ? mapGooglePlaceTypesToDirectoryCategories(card.google_types)
                  : [];
                const directoryTypeHint =
                  directoryCategories.length > 0
                    ? directoryCategories.map((t) => directoryCategoryLabel(t)).join(" · ")
                    : null;
                const cardContent = (
                  <>
                    {card.primary_image_url ? (
                      <div className="aspect-video relative bg-background overflow-hidden rounded-t-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.primary_image_url}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="p-3 space-y-2">
                      <div>
                        <h4 className="font-semibold text-foreground text-base leading-snug line-clamp-2">{card.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {placeType && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                              {placeType}
                            </span>
                          )}
                          {directoryTypeHint ? (
                            <span
                              className="text-2xs text-muted-foreground"
                              title="Mapped from Google Places types (prototype — final map TBD)"
                            >
                              Directory: {directoryTypeHint}
                            </span>
                          ) : null}
                          {card.google_rating != null && (
                            <StarRating
                              value={Math.min(5, Math.max(0, Number(card.google_rating)))}
                              max={5}
                              className="text-[var(--color-warning)]"
                              size={12}
                            />
                          )}
                          {showDmcOperationsOnFile ? (
                            <span className="inline-flex items-center rounded-full bg-[rgba(212,165,116,0.15)] px-2 py-0.5 text-[10px] text-[rgba(212,165,116,0.85)]">
                              Operations on file
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {(card.address || card.city || card.country) && (
                        <p className="text-sm text-muted-foreground flex items-start gap-1.5 line-clamp-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/75" aria-hidden />
                          <span>{[card.address, card.city, card.country].filter(Boolean).join(", ")}</span>
                        </p>
                      )}
                      {card.contact_phone && (
                        <a
                          href={`tel:${card.contact_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-[var(--color-warning)] hover:text-[#E5B87A] hover:underline block truncate"
                        >
                          {card.contact_phone}
                        </a>
                      )}
                      <div className="flex flex-wrap gap-3 pt-1">
                        {externalSearchActive &&
                          onSavePlaceToExternalSearch &&
                          card.directory_product_id &&
                          card.directory_product_id.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSavePlaceToExternalSearch(card.directory_product_id!);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-[rgba(174,133,80,0.35)] bg-[rgba(174,133,80,0.12)] px-2 py-1 text-xs font-medium text-[var(--color-warning)] transition-colors hover:border-[rgba(174,133,80,0.55)] hover:bg-[rgba(174,133,80,0.2)]"
                            >
                              <FolderPlus className="w-3 h-3 shrink-0" aria-hidden />
                              Save to External Search
                            </button>
                          )}
                        {card.google_maps_url && (
                          <a
                            href={card.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-sm text-[var(--color-warning)] hover:text-[#E5B87A]"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                            Map
                          </a>
                        )}
                        {card.website && (
                          <a
                            href={card.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-sm text-[var(--color-warning)] hover:text-[#E5B87A]"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                );
                const cardClass =
                  "bg-card border border-input rounded-xl overflow-hidden hover:border-[rgba(174,133,80,0.5)] transition-colors relative group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(174,133,80,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616] animate-card-slide-in";
                return (
                  <div
                    key={`${card.google_maps_url || card.website || card.name}-${idx}`}
                    className={cardClass}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    role={placeUrl ? "link" : undefined}
                    tabIndex={placeUrl ? 0 : undefined}
                    onClick={
                      placeUrl
                        ? (e: React.MouseEvent) => {
                            if ((e.target as HTMLElement).closest("a, button")) return;
                            window.open(placeUrl, "_blank", "noopener,noreferrer");
                          }
                        : undefined
                    }
                    onKeyDown={
                      placeUrl
                        ? (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              window.open(placeUrl, "_blank", "noopener,noreferrer");
                            }
                          }
                        : undefined
                    }
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
