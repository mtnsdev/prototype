"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Users, MapPin } from "lucide-react";
import { getRepFirmById, MOCK_REP_FIRM_PRODUCT_LINKS, MOCK_REP_FIRMS } from "@/components/products/productDirectoryRepFirmMock";
import { MOCK_DIRECTORY_PRODUCTS } from "@/components/products/productDirectoryMock";
import { EntityChip } from "@/components/ui/entity-link";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { RepFirmDetailHeader } from "./components/RepFirmDetailHeader";
import { RepFirmContactDirectory } from "./components/RepFirmContactDirectory";
import { RepFirmProductGrid } from "./components/RepFirmProductGrid";
import { RepFirmTerritoryCoverage } from "./components/RepFirmTerritoryCoverage";

export default function RepFirmDetailPage() {
  const params = useParams();
  const firmId = typeof params?.id === "string" ? params.id : "";

  const firm = getRepFirmById(firmId);

  if (!firm) {
    return (
      <div className="h-full overflow-y-auto bg-[#08080c] text-[#F5F0EB]">
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="text-[#9B9590]">
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Settings", href: "/dashboard/settings" },
                { label: "Rep Firms", href: "/dashboard/settings/rep-firms" },
                { label: "Not Found" },
              ]}
              className="text-xs"
            />
          </div>
          <Link
            href="/dashboard/settings/rep-firms"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-[#9B9590] transition-colors hover:text-[#F5F0EB]"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            Rep Firms
          </Link>
          <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-8 text-center">
            <p className="text-[#9B9590]">Rep firm not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Find all products represented by this firm
  const linkedProducts = MOCK_DIRECTORY_PRODUCTS.filter((product) => {
    const links = MOCK_REP_FIRM_PRODUCT_LINKS[product.id];
    return links?.some((link) => link.repFirmId === firmId);
  });

  // Collect unique contacts from all product links for this firm
  const allContactsForFirm = new Map<
    string,
    { name: string; email: string; roles: Set<string>; phone?: string; notes?: string }
  >();

  Object.entries(MOCK_REP_FIRM_PRODUCT_LINKS).forEach(([productId, links]) => {
    links.forEach((link) => {
      if (link.repFirmId === firmId) {
        const key = link.contactEmail || `contact-${Math.random()}`;
        if (!allContactsForFirm.has(key)) {
          allContactsForFirm.set(key, {
            name: link.contactName || firm.contactName || "Contact",
            email: link.contactEmail || firm.contactEmail || "",
            roles: new Set(),
            phone: link.contactPhone || firm.contactPhone,
            notes: link.notes,
          });
        }

        const existing = allContactsForFirm.get(key)!;
        const product = MOCK_DIRECTORY_PRODUCTS.find((p) => p.id === productId);
        if (product) {
          for (const t of product.types) {
            existing.roles.add(t);
          }
        }
      }
    });
  });

  const contactsList = Array.from(allContactsForFirm.values()).map((contact) => ({
    ...contact,
    roles: Array.from(contact.roles),
  }));

  return (
    <div className="h-full overflow-y-auto bg-[#08080c] text-[#F5F0EB]">
      <div className="mx-auto max-w-6xl space-y-8 p-6">
        {/* Breadcrumbs */}
        <div className="text-[#9B9590]">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Settings", href: "/dashboard/settings" },
              { label: "Rep Firms", href: "/dashboard/settings/rep-firms" },
              { label: firm.name },
            ]}
            className="text-xs"
          />
        </div>

        {/* Back Link */}
        <Link
          href="/dashboard/settings/rep-firms"
          className="inline-flex items-center gap-1.5 text-xs text-[#9B9590] transition-colors hover:text-[#F5F0EB]"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          Rep Firms Registry
        </Link>

        {/* Header Section */}
        <RepFirmDetailHeader firm={firm} />

        {/* Specialties & Regions */}
        {(firm.productTypes.length > 0 || firm.regions.length > 0) && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-6">
            <h2 className="mb-4 text-sm font-semibold text-[#F5F0EB]">Specialties & Coverage</h2>
            <div className="space-y-4">
              {firm.productTypes.length > 0 && (
                <div>
                  <p className="mb-2 text-2xs text-[#9B9590]">PRODUCT TYPES</p>
                  <div className="flex flex-wrap gap-2">
                    {firm.productTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full bg-[#C9A96E]/10 px-3 py-1.5 text-xs text-[#C9A96E] capitalize"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {firm.regions.length > 0 && (
                <div>
                  <p className="mb-2 text-2xs text-[#9B9590]">REGIONS</p>
                  <div className="flex flex-wrap gap-2">
                    {firm.regions.map((region) => (
                      <div
                        key={region}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-xs text-[#F5F0EB]"
                      >
                        <MapPin className="h-3 w-3 text-[#9B9590]" />
                        {region}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Directory */}
        {contactsList.length > 0 && <RepFirmContactDirectory contacts={contactsList} />}

        {/* Territory Coverage */}
        {firm.propertyCount != null && (
          <RepFirmTerritoryCoverage propertyCount={firm.propertyCount} regions={firm.regions} />
        )}

        {/* Linked Products Grid */}
        {linkedProducts.length > 0 && <RepFirmProductGrid products={linkedProducts} />}

        {/* Empty State */}
        {linkedProducts.length === 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-8 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-[#9B9590]/40" />
            <p className="text-[#9B9590]">No products linked to this rep firm yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
