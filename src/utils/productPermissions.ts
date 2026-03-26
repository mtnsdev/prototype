/**
 * Product permission helpers (Section 11).
 * All functions take current user and optional agency context.
 */

import type { Product, DataOwnershipLevel } from "@/types/product";

export type CurrentUser = {
  id: number | string;
  role: string;
  agency_id?: string | null;
};

/**
 * Can the user edit this product?
 * - Enable-owned: no (read-only).
 * - Agency-owned: user in same agency with edit role.
 * - Advisor-owned: created_by matches user.
 */
export function canEditProduct(
  user: CurrentUser | null,
  product: Product | null
): boolean {
  if (!user || !product) return false;
  const level = (product.data_ownership_level ?? "Advisor") as DataOwnershipLevel;
  if (level === "Enable") return false;
  const uid = String(user.id);
  if (level === "Advisor") return product.created_by === uid;
  if (level === "Agency" && user.agency_id)
    return (
      String(product.agency_id) === String(user.agency_id) &&
      (user.role === "admin" || user.role === "agency_admin" || user.role === "owner")
    );
  return false;
}

/**
 * Can the user delete this product?
 * - Enable-owned: no.
 * - Agency-owned: same agency admin/owner.
 * - Advisor-owned: created_by matches user.
 */
export function canDeleteProduct(
  user: CurrentUser | null,
  product: Product | null
): boolean {
  if (!user || !product) return false;
  const level = (product.data_ownership_level ?? "Advisor") as DataOwnershipLevel;
  if (level === "Enable") return false;
  const uid = String(user.id);
  if (level === "Advisor") return product.created_by === uid;
  if (level === "Agency" && user.agency_id)
    return String(product.agency_id) === String(user.agency_id) && (user.role === "admin" || user.role === "owner");
  return false;
}

/**
 * Can the user view financials (Commercial tab)?
 * - Owner/creator, or agency admin, or role with financial access.
 */
export function canViewFinancials(
  user: CurrentUser | null,
  product: Product | null
): boolean {
  if (!user || !product) return false;
  const uid = String(user.id);
  if (product.created_by === uid) return true;
  if (user.role === "admin" && user.agency_id && product.agency_id === user.agency_id) return true;
  if (user.role === "owner" && user.agency_id && product.agency_id === user.agency_id) return true;
  return false;
}

/**
 * Can the user lock/unlock fields (Governance)?
 * - Agency admin or product owner for Agency/Advisor products.
 */
export function canLockFields(
  user: CurrentUser | null,
  product: Product | null
): boolean {
  if (!user || !product) return false;
  const level = (product.data_ownership_level ?? "Advisor") as DataOwnershipLevel;
  if (level === "Enable") return false;
  const uid = String(user.id);
  if (product.created_by === uid) return true;
  if (user.role === "admin" && user.agency_id && product.agency_id === user.agency_id) return true;
  return false;
}

/**
 * Can the user run bulk operations (delete, export, enrich) on selected products?
 * - Must be able to edit or delete at least one selected; Enable products excluded from destructive ops.
 */
export function canBulkOperate(
  user: CurrentUser | null,
  products: Product[],
  operation: "delete" | "export" | "enrich"
): boolean {
  if (!user || !products.length) return false;
  if (operation === "export") return products.some((p) => p.data_ownership_level !== "Enable" || true);
  if (operation === "delete")
    return products.every((p) => canDeleteProduct(user, p));
  if (operation === "enrich")
    return products.some((p) => canEditProduct(user, p));
  return false;
}

/**
 * Filter products visible in the current tab for this user.
 * - mine: data_ownership_level 'Advisor' + created_by === user.id
 * - agency: data_ownership_level 'Agency' + agency_id === user.agency_id
 * - enable: data_ownership_level 'Enable' (read-only directory)
 */
export function getVisibleProducts(
  user: CurrentUser | null,
  allProducts: Product[],
  tab: "mine" | "agency" | "enable"
): Product[] {
  if (!user) return [];
  const uid = String(user.id);
  const aid = user.agency_id != null ? String(user.agency_id) : null;
  if (tab === "mine")
    return allProducts.filter(
      (p) => (p.data_ownership_level ?? "Advisor") === "Advisor" && p.created_by === uid
    );
  if (tab === "agency")
    return allProducts.filter(
      (p) => (p.data_ownership_level ?? "Agency") === "Agency" && aid && String(p.agency_id) === aid
    );
  if (tab === "enable")
    return allProducts.filter((p) => (p.data_ownership_level ?? "Enable") === "Enable");
  return allProducts;
}
