"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ==========================================
   SVG Illustrations (Luxury, Geometric)
   ========================================== */

/**
 * VICs illustration: Two overlapping circles with gold accent
 * Represents connections and people network
 */
function VICsIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left circle */}
      <circle cx="22" cy="28" r="14" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      {/* Right circle */}
      <circle cx="38" cy="28" r="14" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      {/* Gold accent on overlap */}
      <path
        d="M 30 18 A 14 14 0 0 1 34 22"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

/**
 * Products illustration: Diamond/gem shape with radiating luxury lines
 */
function ProductsIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Diamond shape */}
      <path
        d="M 30 8 L 44 30 L 30 52 L 16 30 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.4"
      />
      {/* Gold facet highlight */}
      <path
        d="M 30 8 L 37 20"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Radiating lines */}
      <line x1="30" y1="30" x2="45" y2="30" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
      <line x1="30" y1="30" x2="15" y2="30" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
    </svg>
  );
}

/**
 * Itineraries illustration: Path/route with waypoint dots
 */
function ItinerariesIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Path line */}
      <path
        d="M 15 45 Q 30 30 45 15"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.4"
        fill="none"
      />
      {/* Waypoint dots */}
      <circle cx="15" cy="45" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="30" cy="30" r="2.5" fill="#C9A96E" opacity="0.8" />
      <circle cx="45" cy="15" r="2.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/**
 * Search results illustration: Magnifying glass with subtle details
 */
function SearchResultsIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Magnifying glass circle */}
      <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      {/* Magnifying glass handle */}
      <line x1="34" y1="34" x2="46" y2="46" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      {/* Cross (not found) */}
      <line x1="22" y1="20" x2="26" y2="28" stroke="#C9A96E" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
      <line x1="26" y1="20" x2="22" y2="28" stroke="#C9A96E" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Knowledge Vault illustration: Stacked document shapes
 */
function KnowledgeVaultIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bottom document */}
      <rect x="16" y="32" width="14" height="18" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      {/* Middle document */}
      <rect x="18" y="26" width="14" height="18" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      {/* Top document with gold accent */}
      <rect x="20" y="20" width="14" height="18" stroke="#C9A96E" strokeWidth="1.2" opacity="0.8" />
      {/* Document lines */}
      <line x1="24" y1="26" x2="30" y2="26" stroke="#C9A96E" strokeWidth="0.8" opacity="0.6" />
      <line x1="24" y1="30" x2="30" y2="30" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

/**
 * Notifications illustration: Bell with subtle waves
 */
function NotificationsIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bell shape */}
      <path
        d="M 30 12 C 26 12 24 16 24 20 L 24 32 C 24 36 20 38 20 40 L 40 40 C 40 38 36 36 36 32 L 36 20 C 36 16 34 12 30 12"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.4"
        fill="none"
      />
      {/* Clapper/dot at bottom */}
      <path
        d="M 26 42 L 34 42 L 32 44 L 28 44 Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
        fill="none"
      />
    </svg>
  );
}

/**
 * Chat illustration: Message bubble with wave
 */
function ChatIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Chat bubble */}
      <path
        d="M 12 14 L 48 14 C 50 14 52 16 52 18 L 52 38 C 52 40 50 42 48 42 L 24 42 L 18 48 L 20 42 L 12 42 C 10 42 8 40 8 38 L 8 18 C 8 16 10 14 12 14"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.4"
        fill="none"
      />
      {/* Chat lines (message indicator) */}
      <line x1="18" y1="24" x2="42" y2="24" stroke="#C9A96E" strokeWidth="1" opacity="0.7" />
      <line x1="18" y1="30" x2="38" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="18" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

/* ==========================================
   Empty State Components
   ========================================== */

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Base Empty State Component
 * Used as wrapper for all empty states with consistent styling
 */
function BaseEmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {/* Illustration container */}
      <div className="mb-6 text-muted-foreground/40">
        {illustration}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground/75 max-w-sm mb-6">
        {description}
      </p>

      {/* CTA Button (optional) */}
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="gap-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * EmptyVICs
 * "Your client book starts here"
 */
export function EmptyVICs({
  action,
  className,
}: Omit<EmptyStateProps, "title" | "description"> & { action?: { label: string; onClick: () => void } }) {
  return (
    <BaseEmptyState
      illustration={<VICsIllustration />}
      title="Your client book starts here"
      description="Add your first VIC to begin building intelligence"
      action={action || { label: "Add VIC", onClick: () => {} }}
      className={className}
    />
  );
}

/**
 * EmptyProducts
 * "Curate your product directory"
 */
export function EmptyProducts({
  action,
  className,
}: Omit<EmptyStateProps, "title" | "description"> & { action?: { label: string; onClick: () => void } }) {
  return (
    <BaseEmptyState
      illustration={<ProductsIllustration />}
      title="Curate your product directory"
      description="Add properties, experiences, and services"
      action={action || { label: "Add Product", onClick: () => {} }}
      className={className}
    />
  );
}

/**
 * EmptyItineraries
 * "No itineraries yet"
 */
export function EmptyItineraries({
  action,
  className,
}: Omit<EmptyStateProps, "title" | "description"> & { action?: { label: string; onClick: () => void } }) {
  return (
    <BaseEmptyState
      illustration={<ItinerariesIllustration />}
      title="No itineraries yet"
      description="Create your first trip to start planning"
      action={action || { label: "Create Itinerary", onClick: () => {} }}
      className={className}
    />
  );
}

/**
 * EmptySearchResults
 * "No results found"
 */
export function EmptySearchResults({
  className,
}: Omit<EmptyStateProps, "title" | "description" | "action">) {
  return (
    <BaseEmptyState
      illustration={<SearchResultsIllustration />}
      title="No results found"
      description="Try adjusting your search or filters"
      className={className}
    />
  );
}

/**
 * EmptyKnowledgeVault
 * "Connect your knowledge sources"
 */
export function EmptyKnowledgeVault({
  action,
  className,
}: Omit<EmptyStateProps, "title" | "description"> & { action?: { label: string; onClick: () => void } }) {
  return (
    <BaseEmptyState
      illustration={<KnowledgeVaultIllustration />}
      title="Connect your knowledge sources"
      description="Link Google Drive, email, or upload documents"
      action={action || { label: "Connect Source", onClick: () => {} }}
      className={className}
    />
  );
}

/**
 * EmptyNotifications
 * "You're all caught up"
 */
export function EmptyNotifications({
  className,
}: Omit<EmptyStateProps, "title" | "description" | "action">) {
  return (
    <BaseEmptyState
      illustration={<NotificationsIllustration />}
      title="You're all caught up"
      description="No new notifications"
      className={className}
    />
  );
}

/**
 * EmptyChat
 * "Ask Enable anything" with suggested prompt chips
 */
export function EmptyChat({
  onPromptSelect,
  className,
}: {
  onPromptSelect?: (prompt: string) => void;
  className?: string;
}) {
  const suggestedPrompts = [
    "What do I know about luxury villas in Bali?",
    "Best Michelin-starred restaurants in Paris",
    "Create an itinerary for a wine country tour",
    "Which of my VICs prefer beach destinations?",
  ];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {/* Illustration */}
      <div className="mb-6 text-muted-foreground/40">
        <ChatIllustration />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Ask Enable anything
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground/75 max-w-sm mb-8">
        Try: "What do I know about..." or "Best hotels in..."
      </p>

      {/* Suggested prompts as chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onPromptSelect?.(prompt)}
            className={cn(
              "px-4 py-3 rounded-lg text-left text-sm",
              "bg-card/50 hover:bg-card",
              "text-muted-foreground hover:text-foreground",
              "transition-all duration-150 ease-out",
              "border border-border hover:border-border-strong",
              "shadow-sm hover:shadow-md"
            )}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ==========================================
   Export all illustrations for standalone use
   ========================================== */

export {
  VICsIllustration,
  ProductsIllustration,
  ItinerariesIllustration,
  SearchResultsIllustration,
  KnowledgeVaultIllustration,
  NotificationsIllustration,
  ChatIllustration,
};
