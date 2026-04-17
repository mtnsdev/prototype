import type { Metadata } from "next";
import { DestinationEditorResolve } from "@/components/destinations/DestinationSlugRoutes";
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
  return <DestinationEditorResolve slug={slug} />;
}
