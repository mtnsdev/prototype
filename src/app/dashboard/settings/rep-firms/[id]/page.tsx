import { redirect } from "next/navigation";

export default async function RepFirmSettingsDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/products?tab=rep-firms&repFirm=${encodeURIComponent(id)}`);
}
