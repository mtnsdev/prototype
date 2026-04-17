"use client";

import type { Hotel, Restaurant } from "@/data/destinations";
import { RestaurantSection } from "@/components/destinations/RestaurantSection";
import { HotelSection } from "@/components/destinations/HotelSection";

type Props =
  | {
      groupingStyle: "pills";
      restaurants: Record<string, Restaurant[]>;
      destinationSlug: string;
      sectionId: string;
    }
  | {
      groupingStyle: "accordion";
      hotels: Record<string, Hotel[]>;
      destinationSlug: string;
      sectionId: string;
    };

export function ProductListSection(props: Props) {
  if (props.groupingStyle === "pills") {
    return (
      <RestaurantSection
        byRegion={props.restaurants}
        destinationSlug={props.destinationSlug}
        sectionId={props.sectionId}
      />
    );
  }
  return (
    <HotelSection
      byGroup={props.hotels}
      destinationSlug={props.destinationSlug}
      sectionId={props.sectionId}
    />
  );
}
