import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DestinationNotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-lg font-semibold text-foreground">Destination not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We don&apos;t have a guide for that destination yet. Try another from the portal.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard/products/destinations">Back to destinations</Link>
      </Button>
    </div>
  );
}
