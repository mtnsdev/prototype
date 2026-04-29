"use client";

import type { VirtualDestinationSection } from "@/lib/destinationSectionModel";
import { ProductListSection } from "@/components/destinations/sections/ProductListSection";
import { ContactListSection } from "@/components/destinations/sections/ContactListSection";
import { DocumentListSection } from "@/components/destinations/sections/DocumentListSection";
import { RichTextSection } from "@/components/destinations/sections/RichTextSection";

type Props = {
  section: VirtualDestinationSection;
  destinationSlug: string;
  /** Page-level active tag filters — passed through to ProductListSection. */
  activeTagFilters?: ReadonlySet<string>;
};

const comingSoon = <p className="text-sm text-muted-foreground">Content coming soon.</p>;

export function SectionRenderer({ section, destinationSlug, activeTagFilters }: Props) {
  switch (section.sectionType) {
    case "product_list":
      if (section.items.length === 0) return comingSoon;
      return (
        <ProductListSection
          section={section}
          destinationSlug={destinationSlug}
          activeTagFilters={activeTagFilters}
        />
      );
    case "contact_list":
      if (section.contacts.length === 0) return comingSoon;
      return <ContactListSection contacts={section.contacts} destinationSlug={destinationSlug} />;
    case "document_list":
      if (section.documents.length === 0) return comingSoon;
      return (
        <DocumentListSection
          documents={section.documents}
          destinationSlug={destinationSlug}
          sectionId={section.id}
        />
      );
    case "rich_text":
      return <RichTextSection section={section} />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}
