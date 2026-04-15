import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestinationBySlug, listDestinationSlugs } from "@/data/destinations";
import { DestinationDetailView } from "@/components/destinations/DestinationDetailView";
import { DestinationDetailSkeleton } from "@/components/destinations/DestinationDetailSkeleton";

export function generateStaticParams() {
  return listDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestinationBySlug(slug);
  if (!d) return { title: "Destination" };
  return {
    title: `${d.name} · Destinations`,
    description: d.tagline,
  };
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = getDestinationBySlug(slug);
  if (!destination) notFound();
  return (
    <Suspense fallback={<DestinationDetailSkeleton />}>
      <DestinationDetailView destination={destination} />
    </Suspense>
  );
}
