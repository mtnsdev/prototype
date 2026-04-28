"use client";

/** Layout wrapper for `/dashboard/products/destinations/*` — matches ProductDirectoryPage surface (`bg-inset`). */
export function DestinationsCatalogChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-inset text-foreground">{children}</div>
  );
}
