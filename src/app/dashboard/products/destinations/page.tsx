import type { Metadata } from "next";
import { DestinationsPortal } from "@/components/destinations/DestinationsPortal";

export const metadata: Metadata = {
  title: "Destinations · Catalog",
  description: "Curated destination guides — DMCs, dining, hotels, and resources for your agency.",
};

export default function DestinationsPortalPage() {
  return <DestinationsPortal />;
}
