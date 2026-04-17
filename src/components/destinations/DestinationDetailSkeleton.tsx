/** Fallback while `useSearchParams` hydrates (Suspense boundary). */
export function DestinationDetailSkeleton() {
  return (
    <div className="min-h-0 flex-1 animate-pulse bg-inset px-6 pb-6 pt-4">
      <div className="h-4 w-32 rounded bg-muted/50" />
      <div className="mt-3 h-24 w-full max-w-2xl rounded-xl border border-border/60 bg-muted/30" />
      <div className="mt-4 space-y-2 max-w-2xl">
        <div className="h-3 w-full rounded bg-muted/40" />
        <div className="h-3 w-4/5 rounded bg-muted/35" />
      </div>
      <div className="mt-8 border-b border-border/80 pb-2">
        <div className="flex gap-2">
          <div className="h-8 w-16 rounded-md bg-muted/35" />
          <div className="h-8 w-24 rounded-md bg-muted/30" />
          <div className="h-8 w-20 rounded-md bg-muted/30" />
        </div>
      </div>
      <div className="mt-5 h-36 w-full rounded-xl border border-border/50 bg-muted/25" />
    </div>
  );
}
