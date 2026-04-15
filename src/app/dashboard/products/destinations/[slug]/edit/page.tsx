import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DestinationEditorDynamic } from "@/components/destinations/editor/DestinationEditorDynamic";
import { getDestinationBySlug } from "@/data/destinations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestinationBySlug(slug);
  if (!d) return { title: "Edit destination" };
  return {
    title: `Edit ${d.name} · Destinations`,
  };
}

export default async function DestinationEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonical = getDestinationBySlug(slug);
  if (!canonical) notFound();

  return <DestinationEditorDynamic canonical={canonical} />;
}
