"use client";

import React from "react";
import { X, Globe, ExternalLink, MapPin } from "lucide-react";
import { StarRating } from "./StarRating";
import type { PlaceCard, WebCitation } from "./types";

type RightPanelProps = {
  isOpen: boolean;
  mode: "places" | "sources" | null;
  placeCards: PlaceCard[];
  webCitations: WebCitation[];
  onClose: () => void;
};

export function RightPanel({ isOpen, mode, placeCards, webCitations, onClose }: RightPanelProps) {
  return (
    <aside
      className={[
        "shrink-0 overflow-hidden border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] ease-out",
        "w-full border-t lg:border-t-0 lg:border-l",
        "max-h-[38vh] lg:max-h-none",
        isOpen ? "lg:w-[420px] xl:w-[460px] min-w-0" : "w-0 min-w-0 lg:w-0 border-l-0",
      ].join(" ")}
      style={{ transition: "width 350ms ease-out" }}
      aria-hidden={!isOpen}
      aria-label={mode === "sources" ? "Web sources panel" : "Places panel"}
    >
      <div className="h-full flex flex-col">
        <div className="shrink-0 px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-2">
          <div>
            <h3 className="text-[14px] font-semibold text-[#F5F5F5]">
              {mode === "sources" ? "Web sources" : "Places"}
            </h3>
            <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5">
              {mode === "sources"
                ? `${webCitations.length} result${webCitations.length !== 1 ? "s" : ""}`
                : `${placeCards.length} result${placeCards.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#F5F5F5] transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5" style={{ minHeight: 0 }}>
          {mode === "sources" && (
            <div className="grid grid-cols-1 gap-3">
              {webCitations.map((wc, idx) => (
                <div
                  key={`${wc.url}-${idx}`}
                  className="bg-[#161616] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 hover:border-[rgba(174,133,80,0.3)] transition-colors relative group"
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
                        <Globe className="w-4 h-4 text-[rgba(245,245,245,0.5)]" aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <a
                        href={wc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[13px] leading-snug line-clamp-2 text-[#F5F5F5] hover:text-[#D4A574] hover:underline block"
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
                const placeUrl = card.google_maps_url || card.website || null;
                const placeType =
                  card.google_types?.[0] != null && card.google_types[0] !== ""
                    ? card.google_types[0].charAt(0).toUpperCase() + card.google_types[0].slice(1).toLowerCase().replace(/_/g, " ")
                    : null;
                const cardContent = (
                  <>
                    {card.primary_image_url ? (
                      <div className="aspect-video relative bg-[#0C0C0C] overflow-hidden rounded-t-xl">
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
                        <h4 className="font-semibold text-[#F5F5F5] text-[14px] leading-snug line-clamp-2">{card.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {placeType && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                              {placeType}
                            </span>
                          )}
                          {card.google_rating != null && (
                            <StarRating
                              value={Math.min(5, Math.max(0, Number(card.google_rating)))}
                              max={5}
                              className="text-[#D4A574]"
                              size={12}
                            />
                          )}
                        </div>
                      </div>
                      {(card.address || card.city || card.country) && (
                        <p className="text-[12px] text-[rgba(245,245,245,0.7)] flex items-start gap-1.5 line-clamp-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[rgba(245,245,245,0.5)]" aria-hidden />
                          <span>{[card.address, card.city, card.country].filter(Boolean).join(", ")}</span>
                        </p>
                      )}
                      {card.contact_phone && (
                        <a
                          href={`tel:${card.contact_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[12px] text-[#D4A574] hover:text-[#E5B87A] hover:underline block truncate"
                        >
                          {card.contact_phone}
                        </a>
                      )}
                      <div className="flex flex-wrap gap-3 pt-1">
                        {card.google_maps_url && (
                          <a
                            href={card.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[12px] text-[#D4A574] hover:text-[#E5B87A]"
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
                            className="inline-flex items-center gap-1 text-[12px] text-[#D4A574] hover:text-[#E5B87A]"
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
                  "bg-[#161616] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden hover:border-[rgba(174,133,80,0.5)] transition-colors relative group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(174,133,80,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616] animate-card-slide-in";
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
