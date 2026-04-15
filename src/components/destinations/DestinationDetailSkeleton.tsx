import { cn } from "@/lib/utils";

/** Fallback while `useSearchParams` hydrates (Suspense boundary). */
export function DestinationDetailSkeleton() {
  return (
    <div className="min-h-0 flex-1 animate-pulse bg-inset px-4 py-5 md:px-6">
      <div className="h-4 w-32 rounded bg-muted/50" />
      <div className="mt-4 h-48 w-full rounded-xl bg-muted/40 md:h-56" />
      <div className="mx-auto mt-6 max-w-4xl space-y-2">
        <div className="h-3 w-full rounded bg-muted/40" />
        <div className="h-3 w-4/5 rounded bg-muted/35" />
      </div>
      <div className="mx-auto mt-8 h-40 max-w-6xl rounded-xl bg-muted/35" />
    </div>
  );
}
