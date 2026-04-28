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

function countGrouped<T>(rec: Record<string, T[]>): number {
  return Object.values(rec).reduce((n, list) => n + list.length, 0);
}

const comingSoon = <p className="text-sm text-muted-foreground">Content coming soon.</p>;

export function SectionRenderer({ section, destinationSlug }: Props) {
  switch (section.sectionType) {
    case "partner_cards":
      if (section.partners.length === 0) {
        return comingSoon;
      }
      return (
        <PartnerCardsSection
          partners={section.partners}
          destinationSlug={destinationSlug}
          sectionId={section.id}
        />
      );
    case "product_list":
      if (section.groupingStyle === "pills") {
        if (countGrouped(section.restaurants) === 0) {
          return comingSoon;
        }
        return (
          <ProductListSection
            groupingStyle="pills"
            restaurants={section.restaurants}
            destinationSlug={destinationSlug}
            sectionId={section.id}
          />
        );
      }
      if (countGrouped(section.hotels) === 0) {
        return comingSoon;
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
      if (section.contacts.length === 0) {
        return comingSoon;
      }
      return <ContactListSection contacts={section.contacts} destinationSlug={destinationSlug} />;
    case "document_list":
      if (section.documents.length === 0) {
        return comingSoon;
      }
      return (
        <DocumentListSection
          documents={section.documents}
          destinationSlug={destinationSlug}
          sectionId={section.id}
        />
      );
    case "rich_text":
      if (!section.text.trim()) {
        return comingSoon;
      }
      return <RichTextSection text={section.text} />;
    case "trip_reports":
      if (section.reports.length === 0) {
        return comingSoon;
      }
      return <TripReportsSection reports={section.reports} destinationSlug={destinationSlug} />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}
