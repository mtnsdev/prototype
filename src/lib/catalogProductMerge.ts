import type { DirectoryProduct } from "@/types/product-directory";
import type { DMCPartner, Hotel, Restaurant, YachtCompany } from "@/data/destinations";

function primaryContactLine(product: DirectoryProduct): string | undefined {
  const c = product.agencyContacts[0];
  if (!c) return undefined;
  const parts = [c.name, c.email, c.phone].filter(Boolean);
  return parts.join(" · ");
}

export function mergeDirectoryProductIntoDmc(partner: DMCPartner, product: DirectoryProduct): DMCPartner {
  return {
    ...partner,
    productId: product.id,
    name: product.name,
    website: product.website ?? partner.website,
    keyContact: primaryContactLine(product) ?? partner.keyContact,
    generalRequests: product.general_requests_email ?? partner.generalRequests,
    pricing: product.pricing_model ?? partner.pricing,
    paymentProcess: product.payment_process ?? partner.paymentProcess,
    commissionProcess: product.commission_process ?? partner.commissionProcess,
    afterHours: product.after_hours_support ?? partner.afterHours,
    reppedBy: product.repped_by ?? partner.reppedBy,
  };
}

export function mergeDirectoryProductIntoRestaurant(row: Restaurant, product: DirectoryProduct): Restaurant {
  return {
    ...row,
    productId: product.id,
    name: product.name,
    url: product.website ?? row.url,
  };
}

export function mergeDirectoryProductIntoHotel(row: Hotel, product: DirectoryProduct): Hotel {
  const link = product.repFirmLinks[0];
  return {
    ...row,
    productId: product.id,
    name: product.name,
    url: product.website ?? row.url,
    contact: primaryContactLine(product) ?? row.contact,
    repFirm: link?.repFirmName ?? row.repFirm,
  };
}

export function mergeDirectoryProductIntoYacht(row: YachtCompany, product: DirectoryProduct): YachtCompany {
  const c = product.agencyContacts[0];
  const contactLine = primaryContactLine(product) ?? row.contact;
  return {
    ...row,
    productId: product.id,
    name: product.name,
    url: product.website ?? row.url,
    destinations: product.destinations_served ?? product.destinations ?? row.destinations,
    contact: contactLine,
    contactName: c?.name ?? row.contactName,
    email: c?.email ?? row.email,
    phone: c?.phone ?? row.phone,
  };
}
