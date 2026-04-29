import { redirect } from "next/navigation";

/** Editing is inline on the destination page — keep this route as a stable redirect for old links. */
export default async function DestinationEditRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/dashboard/products/destinations/${slug}`);
}
