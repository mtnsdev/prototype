"use client";

/** Layout wrapper for `/dashboard/products/destinations/*` — section tabs sit in DestinationsPortal hero. */
export function DestinationsCatalogChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background text-foreground">{children}</div>
  );
}
