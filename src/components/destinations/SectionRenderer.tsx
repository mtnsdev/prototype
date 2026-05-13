"use client";

import type { VirtualDestinationSection } from "@/lib/destinationSectionModel";
import type { DirectoryProduct } from "@/types/product-directory";
import { ProductListSection } from "@/components/destinations/sections/ProductListSection";
import { ContactListSection } from "@/components/destinations/sections/ContactListSection";
import { DocumentListSection } from "@/components/destinations/sections/DocumentListSection";
import { RichTextSection } from "@/components/destinations/sections/RichTextSection";

type Props = {
  section: VirtualDestinationSection;
  destinationSlug: string;
  /** Page-level active tag filters — passed through to ProductListSection. */
  activeTagFilters?: ReadonlySet<string>;
  /** Page-level destination-property filter (product-id allowlist). */
  allowedProductIds?: ReadonlySet<string> | null;
  /** Product display variant — forwarded to ProductListSection. */
  productViewMode?: "cards" | "list";
  /** Catalog lookup map — forwarded to ProductListSection. */
  productLookup?: Map<string, DirectoryProduct>;
  /** Open product callback — forwarded to ProductListSection. */
  onOpenProduct?: (productId: string) => void;
  /** Open collection picker route — forwarded to ProductListSection. */
  onAddToCollection?: (productId: string) => void;
};

export function SectionRenderer({
  section,
  destinationSlug,
  activeTagFilters,
  allowedProductIds,
  productViewMode,
  productLookup,
  onOpenProduct,
  onAddToCollection,
}: Props) {
  switch (section.sectionType) {
    case "product_list":
      return (
        <ProductListSection
          section={section}
          destinationSlug={destinationSlug}
          activeTagFilters={activeTagFilters}
          allowedProductIds={allowedProductIds}
          viewMode={productViewMode ?? "list"}
          productLookup={productLookup}
          onOpenProduct={onOpenProduct}
          onAddToCollection={onAddToCollection}
        />
      );
    case "contact_list":
      if (section.contacts.length === 0) {
        return <p className="text-sm text-muted-foreground">Content coming soon.</p>;
      }
      return <ContactListSection contacts={section.contacts} destinationSlug={destinationSlug} />;
    case "document_list":
      return (
        <DocumentListSection
          section={section}
          destinationSlug={destinationSlug}
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
