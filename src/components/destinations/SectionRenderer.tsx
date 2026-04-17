"use client";

import type { VirtualDestinationSection } from "@/lib/destinationSectionModel";
import { PartnerCardsSection } from "@/components/destinations/sections/PartnerCardsSection";
import { ProductListSection } from "@/components/destinations/sections/ProductListSection";
import { ContactListSection } from "@/components/destinations/sections/ContactListSection";
import { DocumentListSection } from "@/components/destinations/sections/DocumentListSection";
import { RichTextSection } from "@/components/destinations/sections/RichTextSection";
import { TripReportsSection } from "@/components/destinations/sections/TripReportsSection";

type Props = {
  section: VirtualDestinationSection;
  destinationSlug: string;
};

export function SectionRenderer({ section, destinationSlug }: Props) {
  switch (section.sectionType) {
    case "partner_cards":
      return (
        <PartnerCardsSection
          partners={section.partners}
          destinationSlug={destinationSlug}
          sectionId={section.id}
        />
      );
    case "product_list":
      if (section.groupingStyle === "pills") {
        return (
          <ProductListSection
            groupingStyle="pills"
            restaurants={section.restaurants}
            destinationSlug={destinationSlug}
            sectionId={section.id}
          />
        );
      }
      return (
        <ProductListSection
          groupingStyle="accordion"
          hotels={section.hotels}
          destinationSlug={destinationSlug}
          sectionId={section.id}
        />
      );
    case "contact_list":
      return <ContactListSection contacts={section.contacts} destinationSlug={destinationSlug} />;
    case "document_list":
      return (
        <DocumentListSection
          documents={section.documents}
          destinationSlug={destinationSlug}
          sectionId={section.id}
        />
      );
    case "rich_text":
      return <RichTextSection text={section.text} />;
    case "trip_reports":
      return <TripReportsSection reports={section.reports} />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}
