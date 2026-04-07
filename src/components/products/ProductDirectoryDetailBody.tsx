"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bookmark,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Contact,
  ExternalLink,
  Flame,
  Lock,
  Pencil,
  Plus,
  Search,
  Share2,
  Star,
  StickyNote,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type {
  DirectoryAgencyContact,
  DirectoryAgencyNote,
  DirectoryCollectionOption,
  DirectoryPartnerProgram,
  DirectoryProduct,
  DirectoryProductCategory,
} from "@/types/product-directory";
import type { RepFirm, RepFirmProductLink } from "@/types/rep-firm";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import type { Team } from "@/types/teams";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { AMENITY_LABELS } from "./productDirectoryFilterConfig";
import { directoryTierLabel, directoryTierStars } from "./productDirectoryDetailMeta";
import { relativeTime } from "./productDirectoryRelativeTime";
import {
  getPrimaryDirectoryType,
  normalizeDirectoryProductTypes,
} from "@/components/products/directoryProductTypeHelpers";
import { DIRECTORY_PRODUCT_TYPE_CONFIG, directoryCategoryLabel } from "./productDirectoryProductTypes";
import { getRepFirmByIdWithOverlay } from "./productDirectoryRepFirmMock";
import {
  directoryCategoryColors,
  directoryProductGalleryImages,
  directoryProductPlaceLabel,
} from "./productDirectoryVisual";
import {
  directoryProductPartnerProgramsSyncPatch,
  getTopBookableProgramByCommission,
  programFilterId,
  programDisplayCommissionRate,
  programDisplayName,
} from "./productDirectoryCommission";
import { getProductLayerMock } from "./ProductDetail/productLayerMock";
import { FAKE_VICS } from "@/components/vic/fakeData";
import { FAKE_ITINERARIES } from "@/components/itineraries/fakeData";
import { getItinerariesForProduct, getVicsForProduct } from "@/lib/entityCrossLinks";

function clonePartnerProgramsForEdit(list: DirectoryPartnerProgram[]): DirectoryPartnerProgram[] {
  return list.map((p) => ({
    ...p,
    activePromotions: p.activePromotions.map((x) => ({ ...x })),
    amenityTags: p.amenityTags ? [...p.amenityTags] : undefined,
  }));
}

function agencyMocksToDirectoryNotes(
  mocks: { id: string; content: string; author: string; timeAgo: string; pinned?: boolean }[]
): DirectoryAgencyNote[] {
  return mocks.map((n) => ({
    id: n.id,
    authorName: n.author,
    text: n.content,
    createdAt: new Date().toISOString(),
    pinned: n.pinned,
  }));
}

const stableDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatIsoDateStable(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return stableDateFormatter.format(parsed);
}

function formatAdvisoryIncentiveLabel(
  incentiveType: "bonus_percentage" | "bonus_flat" | "override" | "tier_upgrade",
  incentiveValue?: number
): string {
  if (incentiveType === "tier_upgrade") return "Tier upgrade";
  if (incentiveType === "bonus_flat") return `+$${incentiveValue ?? 0} flat`;
  if (incentiveType === "override") return `${incentiveValue ?? 0}% override`;
  return `+${incentiveValue ?? 0}%`;
}

function advisoryProjectionText(
  incentiveType: "bonus_percentage" | "bonus_flat" | "override" | "tier_upgrade",
  incentiveValue: number | undefined,
  baseRate: number | null
): string {
  if (incentiveType === "tier_upgrade") return "Tier upgrade — enhanced amenities & priority";
  if (incentiveType === "override") return `Commission overridden to ${incentiveValue ?? 0}%`;
  if (incentiveType === "bonus_flat") {
    return baseRate != null
      ? `Base ${baseRate}% + $${incentiveValue ?? 0} flat bonus per booking`
      : `+$${incentiveValue ?? 0} flat bonus per booking`;
  }
  if (baseRate == null) return `+${incentiveValue ?? 0}% bonus commission`;
  return `Base ${baseRate}% + Bonus ${incentiveValue ?? 0}% = ${(baseRate ?? 0) + (incentiveValue ?? 0)}% effective`;
}

type PersonalNoteRow = { id: string; text: string; createdAt: string };

type Props = {
  product: DirectoryProduct;
  canViewCommissions: boolean;
  isAdmin: boolean;
  teams: Team[];
  showClose?: boolean;
  onClose?: () => void;
  onOpenCollectionPicker: () => void;
  onPatchProduct: (productId: string, patch: Partial<DirectoryProduct>) => void;
  onAddToItinerary: () => void;
  canRemoveFromCollection?: (collectionId: string) => boolean;
  /** When set with `onQuickAddToCollection`, “Add to Collection” opens an inline picker in the panel. */
  availableCollections?: DirectoryCollectionOption[];
  onQuickAddToCollection?: (collectionId: string) => void;
  /** Opens full collection UI (e.g. modal) for creating a new collection. */
  onRequestCreateCollection?: () => void;
  /** Program keys where this product has product-specific terms (commission/amenities). */
  partnerProgramCustomKeys?: string[];
  /** Live rep firm registry (enables regions/footer lookup beyond seed mock). */
  repFirmsRegistry?: RepFirm[] | null;
};

export function ProductDirectoryDetailBody({
  product,
  canViewCommissions,
  isAdmin,
  teams,
  showClose,
  onClose,
  onOpenCollectionPicker,
  onPatchProduct,
  onAddToItinerary,
  canRemoveFromCollection: canRemoveFromCollectionProp,
  availableCollections,
  onQuickAddToCollection,
  onRequestCreateCollection,
  partnerProgramCustomKeys = [],
  repFirmsRegistry = null,
}: Props) {
  const canRemoveFromCollection = canRemoveFromCollectionProp ?? (() => true);
  const inlinePickerEnabled = Boolean(
    availableCollections && availableCollections.length > 0 && onQuickAddToCollection
  );
  const toast = useToast();
  const { user } = useUser();
  const currentUserId = user ? String(user.id) : "1";

  const detailMock = useMemo(() => getProductLayerMock(product.id), [product.id]);

  const [personalNotes, setPersonalNotes] = useState<PersonalNoteRow[]>([]);
  const [newPersonalNote, setNewPersonalNote] = useState("");
  const [editingPersonalNoteId, setEditingPersonalNoteId] = useState<string | null>(null);
  const [editPersonalNoteDraft, setEditPersonalNoteDraft] = useState("");
  const [personalContacts, setPersonalContacts] = useState<DirectoryAgencyContact[]>([]);
  const [personalContactFormOpen, setPersonalContactFormOpen] = useState(false);
  const [editingPersonalContactId, setEditingPersonalContactId] = useState<string | null>(null);
  const [pcName, setPcName] = useState("");
  const [pcRole, setPcRole] = useState("");
  const [pcEmail, setPcEmail] = useState("");
  const [pcPhone, setPcPhone] = useState("");
  const [pcNote, setPcNote] = useState("");

  const [agencyNotes, setAgencyNotes] = useState<DirectoryAgencyNote[]>([]);
  const [newAgencyNote, setNewAgencyNote] = useState("");
  const [editingAgencyNoteId, setEditingAgencyNoteId] = useState<string | null>(null);
  const [editAgencyNoteDraft, setEditAgencyNoteDraft] = useState("");
  const [upgradeConfirmOpen, setUpgradeConfirmOpen] = useState(false);
  const [upgradeConfirmText, setUpgradeConfirmText] = useState("");
  const [contactUpgradeOpen, setContactUpgradeOpen] = useState(false);
  const [contactUpgradeTarget, setContactUpgradeTarget] = useState<{
    name: string;
    role: string;
    email: string;
    phone?: string;
    note?: string;
  } | null>(null);
  const [agencyContacts, setAgencyContacts] = useState<DirectoryAgencyContact[]>(product.agencyContacts);
  const [agencyContactFormOpen, setAgencyContactFormOpen] = useState(false);
  const [editingAgencyContactId, setEditingAgencyContactId] = useState<string | null>(null);
  const [newAgencyContactName, setNewAgencyContactName] = useState("");
  const [newAgencyContactRole, setNewAgencyContactRole] = useState("");
  const [newAgencyContactEmail, setNewAgencyContactEmail] = useState("");
  const [newAgencyContactPhone, setNewAgencyContactPhone] = useState("");
  const [newAgencyContactNote, setNewAgencyContactNote] = useState("");
  const [panelCollectionOpen, setPanelCollectionOpen] = useState(false);
  const [panelCollectionSearch, setPanelCollectionSearch] = useState("");
  const [partnerProgramsEditMode, setPartnerProgramsEditMode] = useState(false);
  const [localPartnerPrograms, setLocalPartnerPrograms] = useState<DirectoryPartnerProgram[]>(() =>
    clonePartnerProgramsForEdit(product.partnerPrograms)
  );
  const [showRepFirmEditor, setShowRepFirmEditor] = useState(false);
  const [localRepFirmLinks, setLocalRepFirmLinks] = useState<RepFirmProductLink[]>([]);
  const [incentivesExpanded, setIncentivesExpanded] = useState(false);
  const [enableMasterDetailsOpen, setEnableMasterDetailsOpen] = useState(false);

  const productTypesSig = product.types.join("|");
  const [typesDraft, setTypesDraft] = useState<DirectoryProductCategory[]>(() => [...product.types]);
  useEffect(() => {
    setTypesDraft([...product.types]);
  }, [product.id, productTypesSig]);

  const normalizedTypesDraftSig = useMemo(
    () => normalizeDirectoryProductTypes(typesDraft).join("|"),
    [typesDraft]
  );
  const normalizedProductTypesSig = useMemo(
    () => normalizeDirectoryProductTypes(product.types).join("|"),
    [productTypesSig]
  );
  const typesDirty = normalizedTypesDraftSig !== normalizedProductTypesSig;

  const saveEnableMasterDetails = () => {
    const next = normalizeDirectoryProductTypes(typesDraft);
    if (next.length === 0) {
      toast({ title: "Select at least one category", tone: "destructive" });
      return;
    }
    onPatchProduct(product.id, { types: next, updatedAt: new Date().toISOString() });
    toast({ title: "Enable directory record updated", tone: "success" });
    setEnableMasterDetailsOpen(false);
  };

  const cancelEnableMasterDetails = () => {
    setTypesDraft([...product.types]);
    setEnableMasterDetailsOpen(false);
  };

  const toggleProductType = (id: DirectoryProductCategory) => {
    setTypesDraft((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((t) => t !== id);
        if (next.length === 0) {
          toast({ title: "Keep at least one category", tone: "destructive" });
          return prev;
        }
        return next;
      }
      return [...prev, id];
    });
  };

  const setPrimaryProductType = (primary: DirectoryProductCategory) => {
    setTypesDraft((prev) => {
      if (!prev.includes(primary)) return prev;
      return [primary, ...prev.filter((t) => t !== primary)];
    });
  };
  const [vicIntelOpen, setVicIntelOpen] = useState(false);

  const canViewVICData = isAdmin;
  const vicLinks = useMemo(
    () => getVicsForProduct(product.id, FAKE_VICS ?? [], FAKE_ITINERARIES ?? []),
    [product.id]
  );
  const itineraryLinks = useMemo(
    () => getItinerariesForProduct(product.id, FAKE_ITINERARIES ?? []),
    [product.id]
  );

  useEffect(() => {
    setPanelCollectionOpen(false);
    setPanelCollectionSearch("");
    setPartnerProgramsEditMode(false);
    setShowRepFirmEditor(false);
    setLocalRepFirmLinks([]);
    setEditingAgencyNoteId(null);
    setEditingPersonalNoteId(null);
    setEditingAgencyContactId(null);
    setEditingPersonalContactId(null);
    setPersonalContactFormOpen(false);
    setAgencyContactFormOpen(false);
    setUpgradeConfirmOpen(false);
    setUpgradeConfirmText("");
    setContactUpgradeOpen(false);
    setContactUpgradeTarget(null);
    setEnableMasterDetailsOpen(false);
  }, [product.id]);

  useEffect(() => {
    setLocalPartnerPrograms(clonePartnerProgramsForEdit(product.partnerPrograms));
  }, [product.id]);

  useEffect(() => {
    setLocalRepFirmLinks((product.repFirmLinks ?? []).map((l) => ({ ...l })));
  }, [product.id, product.repFirmLinks]);

  const vicIntelDate = (isoDate?: string) => {
    if (!isoDate) return "n/a";
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return "n/a";
    return parsed.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
  };

  const hashColor = (input: string): string => {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) hash = (hash << 5) - hash + input.charCodeAt(i);
    const colors = ["#B8976E", "#5B8A6E", "#7A6B9C", "#8B6F5A", "#5C5852"];
    return colors[Math.abs(hash) % colors.length];
  };

  const displayVicName = (name: string) => {
    if (isAdmin) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return name;
    const last = parts[parts.length - 1];
    return `${parts.slice(0, -1).join(" ")} ${last.charAt(0)}.`;
  };

  useEffect(() => {
    const notes = detailMock.advisorDefaults.notes?.trim();
    const contact = detailMock.advisorDefaults.contact?.trim();
    setPersonalNotes(
      notes
        ? [{ id: `pn-${product.id}-seed`, text: notes, createdAt: new Date().toISOString() }]
        : []
    );
    setPersonalContacts(
      contact
        ? [
            {
              id: `pc-${product.id}-seed`,
              name: "Saved reference",
              role: "Your notes",
              email: "—",
              phone: "—",
              note: contact,
              addedBy: user?.username ?? user?.email ?? "You",
              addedById: currentUserId,
            },
          ]
        : []
    );
    setAgencyNotes(agencyMocksToDirectoryNotes(detailMock.agencyNotes));
  }, [detailMock, product.id, currentUserId, user?.email, user?.username]);

  useEffect(() => {
    setAgencyContacts(product.agencyContacts);
  }, [product.id, product.agencyContacts]);

  useEffect(() => {
    if (!upgradeConfirmOpen && !contactUpgradeOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (upgradeConfirmOpen) {
        setUpgradeConfirmOpen(false);
        setUpgradeConfirmText("");
      }
      if (contactUpgradeOpen) {
        setContactUpgradeOpen(false);
        setContactUpgradeTarget(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [upgradeConfirmOpen, contactUpgradeOpen]);

  const postAgencyNote = () => {
    const t = newAgencyNote.trim();
    if (!t) return;
    const displayName = user?.username ?? user?.email ?? "You";
    const requiresApproval = !isAdmin;
    setAgencyNotes((prev) => [
      {
        id: `n_${Date.now()}`,
        authorName: displayName,
        authorId: currentUserId,
        text: t,
        createdAt: new Date().toISOString(),
        pendingUpgrade: requiresApproval,
        upgradedById: requiresApproval ? currentUserId : undefined,
        upgradedByName: requiresApproval ? displayName : undefined,
      },
      ...prev,
    ]);
    setNewAgencyNote("");
    toast(requiresApproval ? "Note submitted for review" : "Note posted");
  };

  const deleteAgencyNote = (id: string) => {
    setAgencyNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingAgencyNoteId === id) {
      setEditingAgencyNoteId(null);
      setEditAgencyNoteDraft("");
    }
    toast("Note removed");
  };

  const canEditAgencyNote = (n: DirectoryAgencyNote) =>
    !n.pendingUpgrade && (isAdmin || n.authorId === currentUserId);

  const saveAgencyNoteEdit = () => {
    if (!editingAgencyNoteId) return;
    const t = editAgencyNoteDraft.trim();
    if (!t) return;
    setAgencyNotes((prev) =>
      prev.map((n) => (n.id === editingAgencyNoteId ? { ...n, text: t } : n))
    );
    setEditingAgencyNoteId(null);
    setEditAgencyNoteDraft("");
    toast("Note updated");
  };

  const addPersonalNote = () => {
    const t = newPersonalNote.trim();
    if (!t) return;
    setPersonalNotes((prev) => [
      { id: `pn_${Date.now()}`, text: t, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setNewPersonalNote("");
    toast("Personal note saved");
  };

  const savePersonalNoteEdit = () => {
    if (!editingPersonalNoteId) return;
    const t = editPersonalNoteDraft.trim();
    if (!t) return;
    setPersonalNotes((prev) =>
      prev.map((n) => (n.id === editingPersonalNoteId ? { ...n, text: t } : n))
    );
    setEditingPersonalNoteId(null);
    setEditPersonalNoteDraft("");
    toast("Note updated");
  };

  const removePersonalNote = (id: string) => {
    setPersonalNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingPersonalNoteId === id) {
      setEditingPersonalNoteId(null);
      setEditPersonalNoteDraft("");
    }
    toast("Note removed");
  };

  const openPersonalContactFormForAdd = () => {
    setEditingPersonalContactId(null);
    setPcName("");
    setPcRole("");
    setPcEmail("");
    setPcPhone("");
    setPcNote("");
    setPersonalContactFormOpen(true);
  };

  const openPersonalContactFormForEdit = (c: DirectoryAgencyContact) => {
    setEditingPersonalContactId(c.id);
    setPcName(c.name);
    setPcRole(c.role);
    setPcEmail(c.email === "—" ? "" : c.email);
    setPcPhone(c.phone === "—" ? "" : c.phone);
    setPcNote(c.note ?? "");
    setPersonalContactFormOpen(true);
  };

  const savePersonalContact = () => {
    const name = pcName.trim();
    const role = pcRole.trim();
    if (!name || !role) return;
    const row: DirectoryAgencyContact = {
      id: editingPersonalContactId ?? `pc_${Date.now()}`,
      name,
      role,
      email: pcEmail.trim() || "—",
      phone: pcPhone.trim() || "—",
      note: pcNote.trim() || undefined,
      addedBy: user?.username ?? user?.email ?? "You",
      addedById: currentUserId,
    };
    if (editingPersonalContactId) {
      setPersonalContacts((prev) => prev.map((c) => (c.id === editingPersonalContactId ? row : c)));
      toast("Contact updated");
    } else {
      setPersonalContacts((prev) => [...prev, row]);
      toast("Contact saved");
    }
    setPersonalContactFormOpen(false);
    setEditingPersonalContactId(null);
    setPcName("");
    setPcRole("");
    setPcEmail("");
    setPcPhone("");
    setPcNote("");
  };

  const removePersonalContact = (id: string) => {
    setPersonalContacts((prev) => prev.filter((c) => c.id !== id));
    toast("Contact removed");
  };

  const openAgencyContactFormForAdd = () => {
    setEditingAgencyContactId(null);
    setNewAgencyContactName("");
    setNewAgencyContactRole("");
    setNewAgencyContactEmail("");
    setNewAgencyContactPhone("");
    setNewAgencyContactNote("");
    setAgencyContactFormOpen(true);
  };

  const openAgencyContactFormForEdit = (c: DirectoryAgencyContact) => {
    setEditingAgencyContactId(c.id);
    setNewAgencyContactName(c.name);
    setNewAgencyContactRole(c.role);
    setNewAgencyContactEmail(c.email === "—" ? "" : c.email);
    setNewAgencyContactPhone(c.phone === "—" ? "" : c.phone);
    setNewAgencyContactNote(c.note ?? "");
    setAgencyContactFormOpen(true);
  };

  const requestUpgradeToAgency = (noteText: string) => {
    setUpgradeConfirmText(noteText);
    setUpgradeConfirmOpen(true);
  };

  const confirmUpgrade = () => {
    const t = upgradeConfirmText.trim();
    if (!t) return;
    const displayName = user?.username ?? user?.email ?? "You";
    setAgencyNotes((prev) => [
      {
        id: `an-upgrade-${Date.now()}`,
        authorName: displayName,
        authorId: currentUserId,
        text: t,
        createdAt: new Date().toISOString(),
        pendingUpgrade: true,
        upgradedById: currentUserId,
        upgradedByName: displayName,
      },
      ...prev,
    ]);
    setUpgradeConfirmOpen(false);
    setUpgradeConfirmText("");
    toast("Note submitted for review");
  };

  const approveUpgrade = (noteId: string) => {
    setAgencyNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, pendingUpgrade: false } : n)));
    toast("Note approved — now visible to agency");
  };

  const rejectUpgrade = (noteId: string) => {
    setAgencyNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast("Note rejected");
  };

  const requestContactUpgrade = (contact: DirectoryAgencyContact) => {
    setContactUpgradeTarget({
      name: contact.name,
      role: contact.role,
      email: contact.email === "—" ? "" : contact.email,
      phone: contact.phone === "—" ? undefined : contact.phone,
      note: contact.note,
    });
    setContactUpgradeOpen(true);
  };

  const confirmContactUpgrade = () => {
    if (!contactUpgradeTarget) return;
    const displayName = user?.username ?? user?.email ?? "You";
    const row: DirectoryAgencyContact = {
      id: `ac-upgrade-${Date.now()}`,
      name: contactUpgradeTarget.name,
      role: contactUpgradeTarget.role,
      email: contactUpgradeTarget.email.trim() || "—",
      phone: contactUpgradeTarget.phone?.trim() || "—",
      note: contactUpgradeTarget.note?.trim() || undefined,
      addedBy: displayName,
      addedById: currentUserId,
      pendingUpgrade: true,
      upgradedById: currentUserId,
      upgradedByName: displayName,
    };
    const next = [...agencyContacts, row];
    setAgencyContacts(next);
    onPatchProduct(product.id, { agencyContacts: next });
    setContactUpgradeOpen(false);
    setContactUpgradeTarget(null);
    toast("Contact submitted for review");
  };

  const approveContactUpgrade = (contactId: string) => {
    const next = agencyContacts.map((c) => (c.id === contactId ? { ...c, pendingUpgrade: false } : c));
    setAgencyContacts(next);
    onPatchProduct(product.id, { agencyContacts: next });
    toast("Contact approved — now visible to agency");
  };

  const rejectContactUpgrade = (contactId: string) => {
    const next = agencyContacts.filter((c) => c.id !== contactId);
    setAgencyContacts(next);
    onPatchProduct(product.id, { agencyContacts: next });
    if (editingAgencyContactId === contactId) {
      setEditingAgencyContactId(null);
      setAgencyContactFormOpen(false);
    }
    toast("Contact suggestion rejected");
  };

  const removeFromCollection = (collectionId: string) => {
    const collectionIds = product.collectionIds.filter((c) => c !== collectionId);
    const collections = product.collections.filter((c) => c.id !== collectionId);
    onPatchProduct(product.id, {
      collectionIds,
      collections,
      collectionCount: collectionIds.length,
    });
    toast("Removed from collection");
  };

  const saveAgencyContact = () => {
    const name = newAgencyContactName.trim();
    const role = newAgencyContactRole.trim();
    if (!name || !role) return;
    const editId = editingAgencyContactId;
    const prev = editId ? agencyContacts.find((c) => c.id === editId) : undefined;
    const displayName = user?.username ?? user?.email ?? "You";
    const requiresApproval = !isAdmin;
    const pendingUpgrade = requiresApproval ? true : (prev?.pendingUpgrade ?? false);
    const row: DirectoryAgencyContact = {
      id: editId ?? `c_${Date.now()}`,
      name,
      role,
      email: newAgencyContactEmail.trim() || "—",
      phone: newAgencyContactPhone.trim() || "—",
      note: newAgencyContactNote.trim() || undefined,
      addedBy: prev?.addedBy ?? displayName,
      addedById: prev?.addedById ?? currentUserId,
      pendingUpgrade,
      upgradedById: pendingUpgrade ? currentUserId : prev?.upgradedById,
      upgradedByName: pendingUpgrade ? displayName : prev?.upgradedByName,
    };
    const next = editId ? agencyContacts.map((c) => (c.id === editId ? row : c)) : [...agencyContacts, row];
    setAgencyContacts(next);
    onPatchProduct(product.id, { agencyContacts: next });
    setNewAgencyContactName("");
    setNewAgencyContactRole("");
    setNewAgencyContactEmail("");
    setNewAgencyContactPhone("");
    setNewAgencyContactNote("");
    setEditingAgencyContactId(null);
    setAgencyContactFormOpen(false);
    if (requiresApproval) {
      toast(editId ? "Contact update submitted for review" : "Contact submitted for review");
      return;
    }
    toast(editId ? "Contact updated" : "Contact saved");
  };

  const removeAgencyContact = (id: string) => {
    const next = agencyContacts.filter((c) => c.id !== id);
    setAgencyContacts(next);
    onPatchProduct(product.id, { agencyContacts: next });
    if (editingAgencyContactId === id) {
      setEditingAgencyContactId(null);
      setAgencyContactFormOpen(false);
    }
    toast("Contact removed");
  };

  const dismissAdvisory = (advisoryId: string) => {
    if (!isAdmin) return;
    const now = new Date().toISOString();
    const next = (product.commissionAdvisories ?? []).map((advisory) =>
      advisory.id === advisoryId
        ? {
            ...advisory,
            status: "dismissed" as const,
            dismissedAt: now,
            dismissedBy: user?.username ?? user?.email ?? "Admin",
            updatedAt: now,
          }
        : advisory
    );
    onPatchProduct(product.id, {
      commissionAdvisories: next,
      activeAdvisoryCount: next.filter((a) => a.status === "active").length,
    });
    toast("Incentive dismissed");
  };

  const primaryType = getPrimaryDirectoryType(product);
  const cat = directoryCategoryColors(primaryType);
  const typeEntry = DIRECTORY_PRODUCT_TYPE_CONFIG.find((t) => t.id === primaryType);
  const TypeIcon = typeEntry?.icon ?? Building2;
  const typeSummary = product.types.map((t) => directoryCategoryLabel(t)).join(" · ");
  const placeLine =
    product.city && product.country ? `${product.city}, ${product.country}` : directoryProductPlaceLabel(product);

  const tierStars = directoryTierStars(product.tier);
  const enrichment = Math.min(5, Math.max(0, product.enrichmentScore ?? 0));
  const galleryImages = useMemo(
    () => directoryProductGalleryImages(product),
    [product.id, product.imageUrl, product.imageGalleryUrls]
  );

  const showPartnerProgramEditor = isAdmin && partnerProgramsEditMode;
  const repFirmLinks = showRepFirmEditor ? localRepFirmLinks : (product.repFirmLinks ?? []);
  const topCommissionProgram = getTopBookableProgramByCommission(product);
  const baseCommissionForAdvisories = topCommissionProgram ? programDisplayCommissionRate(topCommissionProgram) : null;
  const advisoryGroups = useMemo(() => {
    const list = product.commissionAdvisories ?? [];
    return {
      active: list.filter((a) => a.status === "active"),
      upcoming: list.filter((a) => a.status === "upcoming"),
      expired: list.filter((a) => a.status === "expired"),
    };
  }, [product.commissionAdvisories]);
  const totalVisibleAdvisories =
    advisoryGroups.active.length + advisoryGroups.upcoming.length + advisoryGroups.expired.length;

  const beginPartnerProgramsEdit = () => {
    setLocalPartnerPrograms(clonePartnerProgramsForEdit(product.partnerPrograms));
    setPartnerProgramsEditMode(true);
  };

  const cancelPartnerProgramsEdit = () => {
    setLocalPartnerPrograms(clonePartnerProgramsForEdit(product.partnerPrograms));
    setPartnerProgramsEditMode(false);
  };

  const savePartnerProgramsFromState = () => {
    onPatchProduct(product.id, directoryProductPartnerProgramsSyncPatch(product, localPartnerPrograms));
    toast("Partner programs saved");
    setPartnerProgramsEditMode(false);
  };

  const updateProgramAt = (index: number, patch: Partial<DirectoryPartnerProgram>) => {
    setLocalPartnerPrograms((prev) => {
      const copy = [...prev];
      const cur = { ...copy[index], ...patch };
      if (patch.programName != null || patch.name != null) {
        const nm = (patch.programName ?? patch.name) as string;
        cur.programName = nm;
        cur.name = nm;
      }
      copy[index] = cur;
      return copy;
    });
  };

  const updatePromotionRate = (progIndex: number, promoId: string, effectiveRate: number) => {
    setLocalPartnerPrograms((prev) =>
      prev.map((p, i) => {
        if (i !== progIndex) return p;
        return {
          ...p,
          activePromotions: p.activePromotions.map((pr) =>
            pr.id === promoId ? { ...pr, effectiveRate } : pr
          ),
        };
      })
    );
  };

  const removeProgramAt = (index: number) => {
    const next = localPartnerPrograms.filter((_, i) => i !== index);
    setLocalPartnerPrograms(next);
    onPatchProduct(product.id, directoryProductPartnerProgramsSyncPatch(product, next));
    toast("Partner program removed");
  };

  const addPartnerProgram = () => {
    const stamp = Date.now();
    const row: DirectoryPartnerProgram = {
      id: `pp_new_${stamp}`,
      name: "New partner program",
      programId: `prog_new_${stamp}`,
      programName: "New partner program",
      commissionRate: 10,
      expiryDate: null,
      contact: "",
      activePromotions: [],
      amenities: "",
      amenityTags: [],
      commissionType: "percentage",
      status: "active",
      scope: "enable",
    };
    const next = [...localPartnerPrograms, row];
    setLocalPartnerPrograms(next);
    onPatchProduct(product.id, directoryProductPartnerProgramsSyncPatch(product, next));
    toast("Program linked — edit fields and save");
  };

  const beginRepFirmsEdit = () => {
    setLocalRepFirmLinks((product.repFirmLinks ?? []).map((l) => ({ ...l })));
    setShowRepFirmEditor(true);
  };

  const cancelRepFirmsEdit = () => {
    setShowRepFirmEditor(false);
    setLocalRepFirmLinks([]);
  };

  const updateRepFirmLinkAt = (index: number, patch: Partial<RepFirmProductLink>) => {
    setLocalRepFirmLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeRepFirmLinkAt = (index: number) => {
    setLocalRepFirmLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const addRepFirmLink = () => {
    setLocalRepFirmLinks((prev) => [
      ...prev,
      {
        id: `rfl-new-${Date.now()}`,
        repFirmId: "",
        repFirmName: "",
        scope: "enable",
        status: "active",
      },
    ]);
  };

  const saveRepFirmLinksFromState = () => {
    onPatchProduct(product.id, {
      repFirmLinks: localRepFirmLinks,
      repFirmCount: localRepFirmLinks.length,
    });
    toast("Rep firms saved");
    setShowRepFirmEditor(false);
  };

  return (
    <div className="flex min-h-0 flex-col pb-0">
      {/* Block 1 — Hero + Identity */}
      <div className="relative h-[200px] w-full shrink-0 overflow-hidden bg-popover">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover opacity-90"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-12 w-12 text-white/10" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
        {showClose && onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="absolute right-3 top-3 size-7 min-h-7 min-w-7 rounded-full border-0 bg-black/40 text-white/70 backdrop-blur-sm hover:bg-black/60 hover:text-white"
            aria-label="Close panel"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
              style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
            >
              <TypeIcon className="h-2.5 w-2.5 shrink-0" />
              {typeEntry?.label ?? directoryCategoryLabel(primaryType)}
              {product.types.length > 1 ? (
                <span className="opacity-80"> (+{product.types.length - 1})</span>
              ) : null}
            </span>
            {product.tier && product.tier !== "unrated" && tierStars > 0 ? (
              <span className="text-2xs text-brand-cta">{"★".repeat(tierStars)}</span>
            ) : null}
            {product.priceTier ? (
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {product.priceTier}
              </span>
            ) : null}
          </div>
          <h2 className="text-lg font-semibold leading-tight text-white drop-shadow-sm">{product.name}</h2>
          <p className="mt-0.5 text-xs text-white/70">{placeLine}</p>
        </div>
      </div>

      {galleryImages.length > 0 ? (
        <div className="shrink-0 border-b border-border bg-inset px-3 py-2.5">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Gallery</p>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15">
            {galleryImages.map((url, i) => (
              <img
                key={`${url}-${i}`}
                src={url}
                alt={`${product.name} — gallery ${i + 1}`}
                className="h-[72px] w-[108px] shrink-0 rounded-lg border border-border object-cover"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-5 px-5 pb-2">
      {isAdmin && !enableMasterDetailsOpen ? (
        <div className="-mt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEnableMasterDetailsOpen(true)}
            className="h-8 gap-1.5 rounded-lg border-border bg-white/[0.02] text-xs text-foreground hover:bg-white/[0.05]"
          >
            <Pencil className="size-3.5 shrink-0" aria-hidden />
            Edit product details (Enable)
          </Button>
        </div>
      ) : null}

      {isAdmin && enableMasterDetailsOpen ? (
        <div className="-mt-2 rounded-xl border border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.06)] p-3">
          <p className="mb-1 text-xs font-medium text-foreground">Enable master directory</p>
          <p className="mb-3 text-2xs leading-relaxed text-muted-foreground">
            Edits here update the shared product record your agency sees in the directory (filters, map, and cards).
            Use this to suggest corrections to the Enable team after Google or manual import—more master fields can
            live here over time.
          </p>

          <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Product categories</p>
          <p className="mb-1.5 text-2xs text-muted-foreground/90">
            Choose all that apply. The first category is the primary badge; change it with the dropdown when several
            are selected.
          </p>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 h-9 w-full justify-between gap-2 rounded-lg border-border bg-inset px-3 text-left text-xs font-normal text-foreground"
              >
                <span className="min-w-0 flex-1 truncate">
                  {typesDraft.length === 0
                    ? "Select categories…"
                    : typesDraft.map((t) => directoryCategoryLabel(t)).join(", ")}
                </span>
                <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(100vw-2rem,20rem)] p-2">
              <p className="mb-2 px-1 text-2xs text-muted-foreground">At least one category required.</p>
              <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-0.5">
                {DIRECTORY_PRODUCT_TYPE_CONFIG.map((t) => {
                  const checked = typesDraft.includes(t.id);
                  const Icon = t.icon;
                  return (
                    <li key={t.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/40">
                        <input
                          type="checkbox"
                          className="checkbox-on-dark checkbox-on-dark-sm shrink-0"
                          checked={checked}
                          onChange={() => toggleProductType(t.id)}
                        />
                        <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                        <span className="text-foreground">{t.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </PopoverContent>
          </Popover>

          {typesDraft.length > 1 ? (
            <label className="mt-3 block">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Primary (hero badge)</span>
              <select
                className="mt-1.5 flex h-9 w-full max-w-xs rounded-lg border border-border bg-inset px-2 text-xs text-foreground"
                value={typesDraft[0]}
                onChange={(e) => setPrimaryProductType(e.target.value as DirectoryProductCategory)}
              >
                {typesDraft.map((t) => (
                  <option key={t} value={t}>
                    {directoryCategoryLabel(t)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelEnableMasterDetails}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!typesDirty}
              onClick={saveEnableMasterDetails}
              className="h-8 rounded-lg text-xs"
            >
              Save changes
            </Button>
          </div>
        </div>
      ) : null}

      {/* Block 2 — Quick Facts */}
      <div className="relative z-10 -mt-2 rounded-xl border border-border bg-white/[0.03] p-3">
        <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Type</p>
            <p className="mt-0.5 text-xs font-medium text-foreground">{typeSummary}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Tier</p>
            <p className="mt-0.5 text-xs font-medium text-foreground">
              {product.tier ? directoryTierLabel(product.tier) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Price</p>
            <p className="mt-0.5 text-xs font-medium text-foreground">{product.priceTier ?? "—"}</p>
          </div>

          {product.types.includes("hotel") && (
            <>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Star Rating</p>
                <p className="mt-0.5 text-xs font-medium text-brand-cta">
                  {product.starRating
                    ? `${"★".repeat(product.starRating)} ${product.starRating}/5`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Rooms</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.roomCount ?? "—"}</p>
              </div>
            </>
          )}
          {product.types.includes("restaurant") && (
            <>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Michelin</p>
                <p className="mt-0.5 text-xs font-medium text-brand-cta">
                  {product.michelinStars ? "★".repeat(product.michelinStars) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Cuisine</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.cuisine ?? "—"}</p>
              </div>
            </>
          )}
          {product.types.includes("experience") && (
            <>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Duration</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.duration ?? "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Group Size</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.groupSize ?? "—"}</p>
              </div>
            </>
          )}
          {product.types.includes("cruise") && (
            <>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Cruise Line</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.cruiseLine ?? "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Duration</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.duration ?? "—"}</p>
              </div>
            </>
          )}
          {product.types.includes("dmc") && (
            <div className="col-span-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Destinations</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{product.destinations ?? "—"}</p>
            </div>
          )}
          {product.types.includes("villa") && (
            <>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Bedrooms</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.bedrooms ?? "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Max Guests</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.maxGuests ?? "—"}</p>
              </div>
            </>
          )}
          {product.types.includes("wellness") && (
            <div className="col-span-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Specialty</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{product.specialty ?? "—"}</p>
            </div>
          )}
          {product.types.includes("transport") && (
            <>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Vehicle Type</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.vehicleType ?? "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Capacity</p>
                <p className="mt-0.5 text-xs font-medium text-foreground">{product.capacity ?? "—"}</p>
              </div>
            </>
          )}

          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Enrichment</p>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex gap-[2px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-3 w-1.5 rounded-[1px]"
                    style={{
                      backgroundColor: i < enrichment ? "#5B8A6E" : "rgba(255,255,255,0.06)",
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-muted-foreground">
                {enrichment}/5
              </span>
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Updated</p>
            <p className="mt-0.5 text-xs font-medium text-foreground">
              {product.updatedAt ? relativeTime(product.updatedAt) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Block 3 — Description + Tags + Website */}
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-[rgba(245,240,235,0.75)]">{product.description}</p>
        {(product.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags!.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-white/[0.02] px-2 py-0.5 text-[9px] lowercase text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {product.website ? (
          <a
            href={product.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-2xs text-brand-cta/70 transition-colors hover:text-brand-cta"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            {product.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
          </a>
        ) : null}
      </div>

      {/* Block 4 — Partner Programs */}
      <div className="border-t border-border pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-3.5 w-3.5 shrink-0 text-brand-cta" />
            <span className="text-xs font-medium text-foreground">Partner Programs</span>
            <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {(showPartnerProgramEditor ? localPartnerPrograms : product.partnerPrograms).length}
            </span>
          </div>
          {isAdmin ? (
            showPartnerProgramEditor ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelPartnerProgramsEdit}
                className="h-8 shrink-0 rounded-lg text-xs"
              >
                Cancel editing
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={beginPartnerProgramsEdit}
                className="h-8 shrink-0 rounded-lg border border-brand-cta/35 bg-[rgba(201,169,110,0.08)] text-xs text-brand-cta hover:bg-[rgba(201,169,110,0.14)]"
              >
                <Pencil className="size-3.5" aria-hidden />
                Edit programs
              </Button>
            )
          ) : null}
        </div>
        {showPartnerProgramEditor ? (
          <p className="mb-2 text-[9px] text-muted-foreground">Edit below, then use Save all program changes.</p>
        ) : null}

        {showPartnerProgramEditor ? (
          <>
            {localPartnerPrograms.length === 0 ? (
              <div className="rounded-xl border border-white/[0.03] bg-white/[0.015] py-6 text-center">
                <p className="text-2xs text-muted-foreground">No partner programs linked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {localPartnerPrograms.map((program, index) => {
                  const scopeVal = program.scope === "enable" ? "enable" : (program.scope ?? "");
                  return (
                    <div
                      key={program.id}
                      className="space-y-2 rounded-xl border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.04)] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                          Program {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeProgramAt(index)}
                          className="h-7 gap-1 text-[9px] text-[#A66B6B]/80 hover:text-[#A66B6B]"
                        >
                          <Trash2 className="size-3" aria-hidden />
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Display name</span>
                          <input
                            value={program.programName ?? program.name}
                            onChange={(e) =>
                              updateProgramAt(index, { programName: e.target.value, name: e.target.value })
                            }
                            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Program id (filter key)</span>
                          <input
                            value={program.programId ?? ""}
                            onChange={(e) => updateProgramAt(index, { programId: e.target.value })}
                            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Scope</span>
                          <select
                            value={scopeVal}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateProgramAt(index, { scope: v === "enable" ? "enable" : v });
                            }}
                            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          >
                            <option value="enable">Enable</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Status</span>
                          <select
                            value={program.status ?? "active"}
                            onChange={(e) =>
                              updateProgramAt(index, {
                                status: e.target.value as "active" | "inactive",
                              })
                            }
                            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Commission type</span>
                          <select
                            value={program.commissionType ?? "percentage"}
                            onChange={(e) =>
                              updateProgramAt(index, {
                                commissionType: e.target.value as "percentage" | "flat",
                              })
                            }
                            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat fee ($)</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">
                            {(program.commissionType ?? "percentage") === "flat" ? "Commission $" : "Commission %"}
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            value={program.commissionRate ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateProgramAt(index, {
                                commissionRate: v === "" ? null : Number(v),
                              });
                            }}
                            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Agreement expiry</span>
                          <input
                            type="date"
                            value={
                              program.expiryDate && !Number.isNaN(new Date(program.expiryDate).getTime())
                                ? program.expiryDate.slice(0, 10)
                                : ""
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              updateProgramAt(index, {
                                expiryDate: v ? `${v}T12:00:00.000Z` : null,
                              });
                            }}
                            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Contact</span>
                          <input
                            value={program.contact ?? ""}
                            onChange={(e) => updateProgramAt(index, { contact: e.target.value })}
                            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Amenities copy</span>
                          <textarea
                            value={program.amenities ?? ""}
                            onChange={(e) => updateProgramAt(index, { amenities: e.target.value })}
                            rows={3}
                            className="w-full resize-none rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
                          />
                        </label>
                      </div>
                      {(program.activePromotions?.length ?? 0) > 0 ? (
                        <div className="rounded-lg border border-border bg-inset/80 p-2">
                          <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-[#B8976E]">
                            Promotions (effective %)
                          </p>
                          <div className="space-y-2">
                            {program.activePromotions.map((pr) => (
                              <div key={pr.id} className="flex flex-wrap items-center gap-2 text-2xs text-muted-foreground">
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-16 rounded border border-border bg-inset px-1.5 py-1 text-xs text-foreground"
                                  value={pr.effectiveRate}
                                  onChange={(e) =>
                                    updatePromotionRate(index, pr.id, Number(e.target.value) || 0)
                                  }
                                />
                                <span className="text-[9px]">
                                  Book {pr.bookingStart.slice(0, 10)} → {pr.bookingEnd.slice(0, 10)} · Travel{" "}
                                  {pr.travelStart.slice(0, 10)} → {pr.travelEnd.slice(0, 10)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-2 flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 w-full rounded-lg border border-brand-cta/30 bg-[rgba(201,169,110,0.1)] text-xs font-medium text-brand-cta hover:bg-[rgba(201,169,110,0.15)]"
                onClick={addPartnerProgram}
              >
                <Plus className="size-3.5" aria-hidden />
                Link program
              </Button>
              {localPartnerPrograms.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={savePartnerProgramsFromState}
                  className="h-8 w-full rounded-lg text-xs font-medium"
                >
                  Save all program changes
                </Button>
              ) : null}
            </div>
          </>
        ) : product.partnerPrograms.length === 0 ? (
          <div className="rounded-xl border border-white/[0.03] bg-white/[0.015] py-6 text-center">
            <p className="text-2xs text-muted-foreground">No partner programs linked</p>
          </div>
        ) : (
          <div className="space-y-2">
            {product.partnerPrograms.map((program) => {
              const hasCustomTerms = partnerProgramCustomKeys.includes(programFilterId(program));
              const displayRate = programDisplayCommissionRate(program);
              const active = (program.status ?? "active") === "active";
              const expMs =
                program.expiryDate != null && program.expiryDate !== ""
                  ? new Date(program.expiryDate).getTime() - Date.now()
                  : null;
              const isExpiring =
                program.expiryDate != null &&
                program.expiryDate !== "" &&
                !Number.isNaN(new Date(program.expiryDate).getTime()) &&
                expMs != null &&
                expMs < 30 * 24 * 60 * 60 * 1000 &&
                expMs >= 0;
              const showFooter =
                (canViewCommissions && displayRate != null) ||
                (program.expiryDate != null && program.expiryDate !== "");
              return (
                <div
                  key={program.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02]",
                    !active && "opacity-75"
                  )}
                >
                  <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{programDisplayName(program)}</span>
                      {program.scope === "enable" ? (
                        <span className="shrink-0 rounded bg-[rgba(91,138,110,0.12)] px-1.5 py-0.5 text-[8px] text-[#5B8A6E]">
                          Enable
                        </span>
                      ) : program.scope ? (
                        <ScopeBadge scope={program.scope} teams={teams} className="shrink-0" />
                      ) : null}
                      {!active ? (
                        <span className="text-[8px] uppercase text-muted-foreground">Inactive</span>
                      ) : null}
                      {hasCustomTerms ? (
                        <span className="rounded border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[8px] text-amber-300">
                          Product-specific terms
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {(program.activePromotions?.length ?? 0) > 0 ? (
                    <div className="border-b border-white/[0.04] px-3 py-2">
                      <p className="mb-1 text-[8px] font-medium uppercase tracking-wider text-[#B8976E]">
                        Offers
                      </p>
                      <ul className="space-y-1 text-[9px] text-muted-foreground">
                        {program.activePromotions.map((pr) => (
                          <li key={pr.id} className="space-y-0.5">
                            <div>
                              <span className="font-semibold text-brand-cta">
                                {program.commissionType === "flat" ? `$${pr.effectiveRate}` : `${pr.effectiveRate}%`}
                              </span> · book{" "}
                              {pr.bookingStart.slice(0, 10)}–{pr.bookingEnd.slice(0, 10)}
                            </div>
                            {pr.title?.trim() ? (
                              <p className="text-2xs font-medium text-foreground">{pr.title.trim()}</p>
                            ) : null}
                            {pr.details?.trim() ? (
                              <p className="whitespace-pre-wrap text-[9px] leading-snug text-muted-foreground">
                                {pr.details.trim()}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(program.amenityTags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 px-3 pb-2">
                      {(program.amenityTags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[rgba(91,138,110,0.12)] bg-[rgba(91,138,110,0.08)] px-1.5 py-0.5 text-[8px] text-[#5B8A6E]"
                        >
                          {AMENITY_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                  )}
                  {program.amenities ? (
                    <p className="px-3 pb-2 text-2xs leading-relaxed text-muted-foreground">{program.amenities}</p>
                  ) : null}
                  {(program.lastEditedAt || program.lastEditedByName) ? (
                    <p className="px-3 pb-2 text-[9px] text-muted-foreground">
                      Last edited {program.lastEditedByName ? `by ${program.lastEditedByName}` : ""}
                      {program.lastEditedAt ? ` · ${formatIsoDateStable(program.lastEditedAt)}` : ""}
                    </p>
                  ) : null}
                  {showFooter ? (
                    <div className="flex items-center gap-3 border-t border-white/[0.04] bg-white/[0.015] px-3 py-2">
                      {canViewCommissions && displayRate != null ? (
                        <span className="text-xs font-semibold text-[#B8976E]">
                          {program.commissionType === "flat" ? `$${displayRate}` : `${displayRate}%`}
                        </span>
                      ) : null}
                      {program.expiryDate != null && program.expiryDate !== "" ? (
                        <span
                          className={cn(
                            "ml-auto text-[9px]",
                            isExpiring ? "text-[var(--color-warning)]" : "text-muted-foreground"
                          )}
                        >
                          {isExpiring ? "Expires " : "Until "}
                          {formatIsoDateStable(program.expiryDate)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block 5 — Rep Firms */}
      <div className="border-t border-border pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" style={{ color: "#B07A5B" }} />
            <span className="text-[11px] font-medium text-[#F5F0EB]">Rep Firms</span>
            <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-[#6B6560]">
              {repFirmLinks.length}
            </span>
          </div>
          {isAdmin ? (
            showRepFirmEditor ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelRepFirmsEdit}
                className="h-8 shrink-0 rounded-lg text-xs"
              >
                Cancel editing
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={beginRepFirmsEdit}
                className="h-8 shrink-0 rounded-lg border border-[rgba(176,122,91,0.35)] bg-[rgba(176,122,91,0.08)] text-xs text-[#B07A5B] hover:bg-[rgba(176,122,91,0.14)]"
              >
                <Pencil className="size-3.5" aria-hidden />
                Edit rep firms
              </Button>
            )
          ) : null}
        </div>

        {showRepFirmEditor ? (
          <p className="mb-2 text-[9px] text-[#6B6560]">Edit below, then use Save all rep firm changes.</p>
        ) : null}

        {showRepFirmEditor ? (
          <>
            {localRepFirmLinks.length === 0 ? (
              <div className="rounded-xl border border-white/[0.03] bg-white/[0.015] py-6 text-center">
                <p className="text-[10px] text-[#6B6560]">No rep firms linked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {localRepFirmLinks.map((link, index) => {
                  const scopeVal = link.scope === "enable" ? "enable" : (link.scope ?? "");
                  return (
                    <div
                      key={link.id}
                      className="space-y-2 rounded-xl border border-[rgba(176,122,91,0.15)] bg-[rgba(176,122,91,0.04)] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-[#6B6560]">
                          Rep firm {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeRepFirmLinkAt(index)}
                          className="h-7 gap-1 text-[9px] text-[#A66B6B]/80 hover:text-[#A66B6B]"
                        >
                          <Trash2 className="size-3" aria-hidden />
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Display name</span>
                          <input
                            value={link.repFirmName}
                            onChange={(e) => updateRepFirmLinkAt(index, { repFirmName: e.target.value })}
                            className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Rep Firm id</span>
                          <input
                            value={link.repFirmId}
                            onChange={(e) => updateRepFirmLinkAt(index, { repFirmId: e.target.value })}
                            className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Scope</span>
                          <select
                            value={scopeVal}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateRepFirmLinkAt(index, { scope: v === "enable" ? "enable" : v });
                            }}
                            className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none"
                          >
                            <option value="enable">Enable</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Status</span>
                          <select
                            value={link.status ?? "active"}
                            onChange={(e) =>
                              updateRepFirmLinkAt(index, {
                                status: e.target.value as "active" | "inactive",
                              })
                            }
                            className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Contact name</span>
                          <input
                            value={link.contactName ?? ""}
                            onChange={(e) => updateRepFirmLinkAt(index, { contactName: e.target.value })}
                            className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Contact email</span>
                          <input
                            value={link.contactEmail ?? ""}
                            onChange={(e) => updateRepFirmLinkAt(index, { contactEmail: e.target.value })}
                            className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Contact phone</span>
                          <input
                            value={link.contactPhone ?? ""}
                            onChange={(e) => updateRepFirmLinkAt(index, { contactPhone: e.target.value })}
                            className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none"
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Notes</span>
                          <textarea
                            value={link.notes ?? ""}
                            onChange={(e) => updateRepFirmLinkAt(index, { notes: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-2 flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 w-full rounded-lg border border-[rgba(176,122,91,0.30)] bg-[rgba(176,122,91,0.1)] text-xs font-medium text-[#B07A5B] hover:bg-[rgba(176,122,91,0.15)]"
                onClick={addRepFirmLink}
              >
                <Plus className="size-3.5" aria-hidden />
                Link rep firm
              </Button>
              {localRepFirmLinks.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveRepFirmLinksFromState}
                  className="h-8 w-full rounded-lg text-xs font-medium"
                >
                  Save all rep firm changes
                </Button>
              ) : null}
            </div>
          </>
        ) : repFirmLinks.length === 0 ? (
          <div className="rounded-xl border border-white/[0.03] bg-white/[0.015] py-6 text-center">
            <p className="text-[10px] text-[#6B6560]">No rep firms linked</p>
          </div>
        ) : (
          <div className="space-y-2">
            {repFirmLinks.map((link) => {
              const active = (link.status ?? "active") === "active";
              const firmRow = getRepFirmByIdWithOverlay(link.repFirmId, repFirmsRegistry);
              const regionsLabel = firmRow?.regions?.length ? firmRow.regions.join(", ") : "—";
              return (
                <div
                  key={link.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02]",
                    !active && "opacity-75"
                  )}
                >
                  <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium text-[#F5F0EB]">{link.repFirmName}</span>
                      {link.scope === "enable" ? (
                        <span className="shrink-0 rounded bg-[rgba(91,138,110,0.12)] px-1.5 py-0.5 text-[8px] text-[#5B8A6E]">
                          Enable
                        </span>
                      ) : link.scope ? (
                        <ScopeBadge scope={link.scope} teams={teams} className="shrink-0" />
                      ) : null}
                      {!active ? <span className="text-[8px] uppercase text-[#6B6560]">Inactive</span> : null}
                    </div>
                  </div>
                  {link.contactName || link.contactEmail || link.contactPhone ? (
                    <p className="px-3 pb-2 text-[10px] text-[#9B9590]">
                      Contact: {link.contactName ?? "—"}
                      {link.contactEmail ? (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={`mailto:${link.contactEmail}`}
                            className="text-[#B07A5B]/70 hover:text-[#B07A5B]"
                          >
                            {link.contactEmail}
                          </a>
                        </>
                      ) : null}
                      {link.contactPhone ? <> · {link.contactPhone}</> : null}
                    </p>
                  ) : null}
                  {link.notes ? (
                    <p className="px-3 pb-2 text-[9px] leading-relaxed text-[#9B9590]">{link.notes}</p>
                  ) : null}
                  {link.lastEditedByName ? (
                    <p className="px-3 pb-2 text-[9px] text-[#6B6560]">
                      Last edited by {link.lastEditedByName}
                      {link.lastEditedAt
                        ? ` · ${new Date(link.lastEditedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3 border-t border-white/[0.04] bg-white/[0.015] px-3 py-2">
                    <span
                      className={cn(
                        "shrink-0 text-[9px] font-medium",
                        active ? "text-[#5B8A6E]" : "text-[#6B6560]"
                      )}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                    <span className="min-w-0 flex-1 text-right text-[9px] text-[#6B6560]">
                      Regions: {regionsLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block 6 — VIC intelligence */}
      {canViewVICData ? (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setVicIntelOpen((open) => !open)}
            className="mb-3 flex w-full items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0 text-[#B8976E]" />
              <span className="text-xs font-medium text-foreground">VIC intelligence</span>
              <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {vicLinks.length}
              </span>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", vicIntelOpen && "rotate-180")} />
          </button>
          {vicIntelOpen ? (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground">
                {vicLinks.length} VIC{vicLinks.length !== 1 ? "s" : ""} linked via itinerary activity or manual signals.
              </p>
              {vicLinks.length > 0 ? (
                <div className="space-y-2">
                  {vicLinks.map((link) => (
                    <div key={`${link.vicId}-${link.productId}`} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-2.5 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium text-[#0E0E0E]"
                          style={{ backgroundColor: hashColor(link.vicName) }}
                        >
                          {link.vicName.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate text-xs text-foreground">{displayVicName(link.vicName)}</span>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {link.visitCount} visit{link.visitCount !== 1 ? "s" : ""} · {vicIntelDate(link.lastVisitDate)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-white/[0.03] bg-white/[0.015] px-3 py-2 text-[10px] text-muted-foreground">
                  No linked VICs yet.
                </p>
              )}
              <div className="border-t border-border/70 pt-2">
                <p className="text-xs text-foreground">
                  Also in {itineraryLinks.length} itinerar{itineraryLinks.length === 1 ? "y" : "ies"}
                </p>
                {itineraryLinks.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {itineraryLinks.map((row) => (
                      <div key={row.itineraryId} className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="truncate text-foreground">{row.itineraryName}</span>
                        {canViewCommissions ? (
                          <span className="shrink-0 text-[#B8976E]">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "EUR",
                              maximumFractionDigits: 0,
                            }).format(row.totalSpend)}
                          </span>
                        ) : (
                          <span className="shrink-0 text-muted-foreground">{row.eventCount} event{row.eventCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {canViewCommissions ? (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setIncentivesExpanded((prev) => !prev)}
            className="mb-3 flex w-full items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-amber-400" aria-hidden />
              <span className="text-xs font-medium text-foreground">Commission Incentives</span>
            </div>
            <span className="text-2xs text-amber-300">
              {incentivesExpanded ? "▲" : "▼"} {advisoryGroups.active.length} active
            </span>
          </button>
          {incentivesExpanded ? (
            totalVisibleAdvisories === 0 ? (
              <div className="rounded-xl border border-white/[0.03] bg-white/[0.015] py-6 text-center">
                <p className="text-2xs text-muted-foreground">No advisory incentives on this product yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(
                  [
                    ["ACTIVE", advisoryGroups.active, "active"],
                    ["UPCOMING", advisoryGroups.upcoming, "upcoming"],
                    ["EXPIRED", advisoryGroups.expired, "expired"],
                  ] as const
                ).map(([label, items, kind]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={label}>
                      <p className="mb-2 text-[10px] tracking-wide text-muted-foreground">{label}</p>
                      <div className="space-y-2">
                        {items.map((advisory) => {
                          const SourceIcon =
                            {
                              rep_firm: Users,
                              partner_program: Award,
                              internal: Building2,
                              virtuoso: Star,
                            }[advisory.source] ?? Building2;
                          return (
                            <div
                              key={advisory.id}
                              className={cn(
                                "rounded-xl border border-white/[0.05] bg-white/[0.02] p-3",
                                kind === "active" && "border-l-2 border-l-amber-400",
                                kind === "upcoming" && "border-l-2 border-l-amber-500 border-dashed opacity-80",
                                kind === "expired" && "opacity-50"
                              )}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-medium text-foreground">{advisory.title}</p>
                                <span className="text-[10px] text-amber-300">
                                  {formatAdvisoryIncentiveLabel(advisory.incentiveType, advisory.incentiveValue)}
                                </span>
                              </div>
                              <p className={cn("mt-1 text-[10px] text-muted-foreground", kind === "expired" && "line-through")}>
                                {kind === "upcoming"
                                  ? `Starts ${formatIsoDateStable(advisory.validFrom)}`
                                  : kind === "expired"
                                    ? `Ended ${formatIsoDateStable(advisory.validUntil)}`
                                    : `${formatIsoDateStable(advisory.validFrom)} – ${formatIsoDateStable(advisory.validUntil)}`}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <SourceIcon className="h-3 w-3" aria-hidden />
                                via {advisory.sourceName}
                              </p>
                              {advisory.details?.trim() ? (
                                <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">{advisory.details.trim()}</p>
                              ) : null}
                              <p className="mt-2 text-2xs text-amber-200/90">
                                {advisoryProjectionText(
                                  advisory.incentiveType,
                                  advisory.incentiveValue,
                                  baseCommissionForAdvisories
                                )}
                              </p>
                              {kind === "active" && isAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => dismissAdvisory(advisory.id)}
                                  className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-300 transition-colors hover:bg-amber-500/10"
                                >
                                  Dismiss
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {/* Contacts — personal (private) then agency (shared) */}
      <div className="border-t border-border pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Contact className="h-3.5 w-3.5 shrink-0 text-brand-cta" />
          <span className="text-xs font-medium text-foreground">Contacts</span>
        </div>

        <div className="rounded-xl border border-[rgba(160,140,180,0.10)] bg-[rgba(160,140,180,0.03)] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 shrink-0" style={{ color: "rgba(160,140,180,0.50)" }} />
              <span className="text-2xs font-medium" style={{ color: "rgba(160,140,180,0.60)" }}>
                Private
              </span>
              {personalContacts.length > 0 ? (
                <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {personalContacts.length}
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={openPersonalContactFormForAdd}
              className="h-7 text-[rgba(160,140,180,0.65)] hover:text-[rgba(160,140,180,0.9)]"
            >
              <Plus className="size-3" aria-hidden />
              Add
            </Button>
          </div>
          {personalContacts.length === 0 ? (
            <p className="py-2 text-center text-2xs text-muted-foreground/65">None yet</p>
          ) : (
            <div className="space-y-1.5">
              {personalContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{c.name}</span>
                      <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[8px] text-muted-foreground">{c.role}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      {c.email && c.email !== "—" ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="text-[9px] text-brand-cta/60 transition-colors hover:text-brand-cta"
                        >
                          {c.email}
                        </a>
                      ) : null}
                      {c.phone && c.phone !== "—" ? (
                        <span className="text-[9px] text-muted-foreground">{c.phone}</span>
                      ) : null}
                    </div>
                    {c.note ? <p className="mt-0.5 text-[9px] text-muted-foreground">{c.note}</p> : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => requestContactUpgrade(c)}
                      className="mt-1.5 h-7 pl-0 text-[9px] text-muted-foreground hover:text-brand-cta"
                    >
                      <Share2 className="size-3" aria-hidden />
                      Suggest to agency…
                    </Button>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => openPersonalContactFormForEdit(c)}
                      className="h-6 text-[9px] text-muted-foreground/65 hover:text-brand-cta"
                    >
                      <Pencil className="size-3" aria-hidden />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => removePersonalContact(c.id)}
                      className="h-6 text-[9px] text-[#A66B6B]/60 hover:text-[#A66B6B]"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {personalContactFormOpen && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-white/[0.02] p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {editingPersonalContactId ? "Edit contact" : "New contact"}
              </p>
              <input
                value={pcName}
                onChange={(e) => setPcName(e.target.value)}
                placeholder="Name *"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <input
                value={pcRole}
                onChange={(e) => setPcRole(e.target.value)}
                placeholder="Role *"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <input
                value={pcEmail}
                onChange={(e) => setPcEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <input
                value={pcPhone}
                onChange={(e) => setPcPhone(e.target.value)}
                placeholder="Phone"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <input
                value={pcNote}
                onChange={(e) => setPcNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  disabled={!pcName.trim() || !pcRole.trim()}
                  onClick={savePersonalContact}
                  className="h-7 text-[rgba(160,140,180,0.9)]"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setPersonalContactFormOpen(false);
                    setEditingPersonalContactId(null);
                    setPcName("");
                    setPcRole("");
                    setPcEmail("");
                    setPcPhone("");
                    setPcNote("");
                  }}
                  className="h-7 text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/65">Agency</span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        <div className="rounded-xl border border-[rgba(140,160,180,0.10)] bg-[rgba(140,160,180,0.03)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5 text-[rgba(140,160,180,0.5)]" aria-hidden />
              {agencyContacts.length > 0 ? (
                <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {agencyContacts.length}
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={openAgencyContactFormForAdd}
              className="h-7 text-[rgba(140,160,180,0.65)] hover:text-[rgba(140,160,180,0.9)]"
            >
              <Plus className="size-3" aria-hidden />
              Add
            </Button>
          </div>
          {agencyContacts.length === 0 ? (
            <div className="rounded-xl border border-white/[0.03] bg-white/[0.015] py-5 text-center">
              <UserPlus className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground/65" />
              <p className="text-2xs text-muted-foreground">None yet</p>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={openAgencyContactFormForAdd}
                className="mt-1.5 h-7 text-[rgba(140,160,180,0.65)] hover:text-[rgba(140,160,180,0.9)]"
              >
                Add contact
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {agencyContacts.map((c) => {
                const canEdit = isAdmin || c.addedById === currentUserId;
                return (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{c.name}</span>
                        <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[8px] text-muted-foreground">{c.role}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {c.email && c.email !== "—" ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="text-[9px] text-brand-cta/60 transition-colors hover:text-brand-cta"
                          >
                            {c.email}
                          </a>
                        ) : null}
                        {c.phone && c.phone !== "—" ? (
                          <span className="text-[9px] text-muted-foreground">{c.phone}</span>
                        ) : null}
                      </div>
                      {c.note ? <p className="mt-0.5 text-[9px] italic text-muted-foreground">{c.note}</p> : null}
                      {c.addedBy ? (
                        <span className="mt-0.5 block text-[8px] text-muted-foreground/65">Added by {c.addedBy}</span>
                      ) : null}
                      {c.pendingUpgrade ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[9px] text-brand-cta">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            Pending approval — suggested by {c.upgradedByName || c.addedBy || "advisor"}
                          </span>
                          {isAdmin ? (
                            <div className="ml-auto flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="h-6 text-[#5B8A6E] hover:text-[#6DA07E]"
                                onClick={() => approveContactUpgrade(c.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="h-6 text-[#A66B6B] hover:text-[#BA7E7E]"
                                onClick={() => rejectContactUpgrade(c.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => openAgencyContactFormForEdit(c)}
                          className="h-6 text-[9px] text-muted-foreground/65 hover:text-brand-cta"
                        >
                          <Pencil className="size-3" aria-hidden />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeAgencyContact(c.id)}
                          className="h-6 text-[9px] text-[#A66B6B]/60 hover:text-[#A66B6B]"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          {agencyContactFormOpen && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-white/[0.02] p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {editingAgencyContactId ? "Edit contact" : "New contact"}
              </p>
              <input
                value={newAgencyContactName}
                onChange={(e) => setNewAgencyContactName(e.target.value)}
                placeholder="Name *"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <input
                value={newAgencyContactRole}
                onChange={(e) => setNewAgencyContactRole(e.target.value)}
                placeholder="Role *"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <input
                value={newAgencyContactEmail}
                onChange={(e) => setNewAgencyContactEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <input
                value={newAgencyContactPhone}
                onChange={(e) => setNewAgencyContactPhone(e.target.value)}
                placeholder="Phone"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <input
                value={newAgencyContactNote}
                onChange={(e) => setNewAgencyContactNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  disabled={!newAgencyContactName.trim() || !newAgencyContactRole.trim()}
                  onClick={saveAgencyContact}
                  className="h-7 text-[rgba(140,160,180,0.9)]"
                >
                  {isAdmin ? "Save contact" : "Submit for review"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setAgencyContactFormOpen(false);
                    setEditingAgencyContactId(null);
                    setNewAgencyContactName("");
                    setNewAgencyContactRole("");
                    setNewAgencyContactEmail("");
                    setNewAgencyContactPhone("");
                    setNewAgencyContactNote("");
                  }}
                  className="h-7 text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes — personal then agency */}
      <div className="border-t border-border pt-4">
        <div className="mb-3 flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 shrink-0 text-brand-cta" />
          <span className="text-xs font-medium text-foreground">Notes</span>
        </div>

        <div className="rounded-xl border border-[rgba(160,140,180,0.10)] bg-[rgba(160,140,180,0.03)] p-3">
          <div className="mb-3 flex items-center gap-1.5">
            <Lock className="h-3 w-3 shrink-0" style={{ color: "rgba(160,140,180,0.50)" }} />
            <span className="text-2xs font-medium" style={{ color: "rgba(160,140,180,0.60)" }}>
              Private
            </span>
          </div>
          <p className="mb-3 text-2xs leading-relaxed text-muted-foreground/70">
            Visible only to you. Use <span className="text-muted-foreground">Suggest to agency</span> when a note
            should become shared — an admin approves it before it appears in agency notes.
          </p>

          <div className="mb-3 space-y-2">
            {personalNotes.length === 0 ? (
              <p className="py-1 text-center text-2xs text-muted-foreground/65">None yet</p>
            ) : (
              personalNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5"
                >
                  {editingPersonalNoteId === note.id ? (
                    <>
                      <textarea
                        value={editPersonalNoteDraft}
                        onChange={(e) => setEditPersonalNoteDraft(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-border bg-white/[0.03] px-2 py-1.5 text-xs text-[#C8C0B8] outline-none"
                      />
                      <div className="mt-1.5 flex gap-2">
                        <Button type="button" variant="secondary" size="xs" onClick={savePersonalNoteEdit} className="h-7 text-[#5B8A6E]">
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingPersonalNoteId(null);
                            setEditPersonalNoteDraft("");
                          }}
                          className="h-7 text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs leading-relaxed text-[#C8C0B8]">{note.text}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[9px] text-muted-foreground/65">{relativeTime(note.createdAt)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingPersonalNoteId(note.id);
                            setEditPersonalNoteDraft(note.text);
                          }}
                          className="h-6 text-[9px] text-muted-foreground/65 hover:text-brand-cta"
                        >
                          <Pencil className="size-3" aria-hidden />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removePersonalNote(note.id)}
                          className="h-6 text-[9px] text-[#A66B6B]/60 hover:text-[#A66B6B]"
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => requestUpgradeToAgency(note.text)}
                          className="ml-auto h-6 text-[9px] text-muted-foreground hover:text-brand-cta"
                        >
                          <Share2 className="size-3" aria-hidden />
                          Suggest to agency
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 border-t border-white/[0.05] pt-3">
            <textarea
              value={newPersonalNote}
              onChange={(e) => setNewPersonalNote(e.target.value)}
              placeholder="Write a private note…"
              rows={2}
              className="min-h-0 flex-1 resize-none rounded-lg border border-border bg-white/[0.03] px-2 py-1.5 text-xs text-[#C8C0B8] outline-none placeholder:text-muted-foreground/65"
            />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={addPersonalNote}
              className="self-end h-7 text-[rgba(160,140,180,0.75)] hover:text-[rgba(160,140,180,0.95)]"
            >
              Add
            </Button>
          </div>

        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/65">Agency</span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        <div className="rounded-xl border border-[rgba(140,160,180,0.10)] bg-[rgba(140,160,180,0.03)] p-3">
          <p className="mb-3 text-2xs leading-relaxed text-muted-foreground/70">
            Agency notes are shared with your team after admin approval when suggested from private notes.
          </p>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-3 w-3 shrink-0" style={{ color: "rgba(140,160,180,0.50)" }} aria-hidden />
            {agencyNotes.length > 0 ? (
              <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {agencyNotes.length}
              </span>
            ) : null}
          </div>

          <div className="mb-3 space-y-2">
            {agencyNotes.length === 0 ? (
              <p className="py-2 text-center text-2xs text-muted-foreground/65">None yet</p>
            ) : (
              agencyNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.03] p-3"
                >
                  {note.pendingUpgrade && (
                    <div className="mb-1.5 flex flex-wrap items-center gap-1 text-[9px] text-brand-cta">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>
                        Pending approval — suggested by{" "}
                        {note.upgradedByName || note.authorName || "advisor"}
                      </span>
                      {isAdmin && (
                        <div className="ml-auto flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-6 text-[#5B8A6E] hover:text-[#6DA07E]"
                            onClick={() => approveUpgrade(note.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-6 text-[#A66B6B] hover:text-[#BA7E7E]"
                            onClick={() => rejectUpgrade(note.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {editingAgencyNoteId === note.id && canEditAgencyNote(note) && !note.pendingUpgrade ? (
                    <>
                      <textarea
                        value={editAgencyNoteDraft}
                        onChange={(e) => setEditAgencyNoteDraft(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-border bg-white/[0.03] px-2 py-1.5 text-xs text-[#C8C0B8] outline-none"
                      />
                      <div className="mt-2 flex gap-2">
                        <Button type="button" variant="secondary" size="xs" onClick={saveAgencyNoteEdit} className="h-7 text-[#5B8A6E]">
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingAgencyNoteId(null);
                            setEditAgencyNoteDraft("");
                          }}
                          className="h-7 text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs leading-relaxed text-[#C8C0B8]">{note.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-2xs text-muted-foreground">{note.authorName}</span>
                        <span className="text-2xs text-muted-foreground/65">·</span>
                        <span className="text-2xs text-muted-foreground/65">{relativeTime(note.createdAt)}</span>
                        {note.pinned ? (
                          <span className="ml-auto text-[9px] text-amber-500/60">Pinned</span>
                        ) : null}
                      </div>
                      {canEditAgencyNote(note) && !note.pendingUpgrade ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-6 text-[9px] text-muted-foreground/65 hover:text-brand-cta"
                            onClick={() => {
                              setEditingAgencyNoteId(note.id);
                              setEditAgencyNoteDraft(note.text);
                            }}
                          >
                            <Pencil className="size-3" aria-hidden />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-6 text-[9px] text-muted-foreground/65 hover:text-brand-cta"
                            onClick={() => deleteAgencyNote(note.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newAgencyNote}
              onChange={(e) => setNewAgencyNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") postAgencyNote();
              }}
              placeholder="Post to agency…"
              className="flex-1 rounded-lg border border-border bg-white/[0.03] px-3 py-2 text-xs text-[#C8C0B8] outline-none placeholder:text-muted-foreground/65"
            />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={postAgencyNote}
              className="self-center h-7 text-[rgba(140,160,180,0.75)] hover:text-[rgba(140,160,180,0.95)]"
            >
              {isAdmin ? "Post" : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      {/* Collections (compact) — last before sticky actions */}
      <div className="border-t border-border pb-2 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Bookmark className="h-3.5 w-3.5 shrink-0 text-brand-cta" />
          <span className="text-xs font-medium text-foreground">Collections</span>
          <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
            {product.collections.length}
          </span>
        </div>
        <div className="mb-2 space-y-2">
          {product.collections.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-popover p-2.5"
            >
              <div className="min-w-0 flex-1 text-2xs">
                <p className="font-medium text-foreground">{collection.name}</p>
                <div className="mt-2">
                  <ScopeBadge scope={collection.scope} teams={teams} />
                </div>
              </div>
              {canRemoveFromCollection(collection.id) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-7 text-[9px] text-muted-foreground/65 hover:text-brand-cta"
                  onClick={() => removeFromCollection(collection.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Block 7 — Sticky quick actions + inline collection picker */}
      <div className="sticky bottom-0 z-10 mt-4 border-t border-border bg-inset/95 backdrop-blur-sm">
        {inlinePickerEnabled && panelCollectionOpen && (
          <div className="max-h-[220px] overflow-y-auto border-b border-white/[0.04] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xs font-medium text-foreground">Add to collection</span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setPanelCollectionOpen(false);
                  setPanelCollectionSearch("");
                }}
                className="h-6 text-[9px] text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
            <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2 py-1.5">
              <Search className="h-3 w-3 shrink-0 text-muted-foreground/65" />
              <input
                value={panelCollectionSearch}
                onChange={(e) => setPanelCollectionSearch(e.target.value)}
                placeholder="Search collections…"
                autoFocus
                className="flex-1 bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground/65"
              />
            </div>
            <div className="space-y-1">
              {(availableCollections ?? [])
                .filter((c) => c.name.toLowerCase().includes(panelCollectionSearch.toLowerCase()))
                .map((col) => {
                  const alreadyIn = product.collectionIds.includes(col.id);
                  const count = col.productIds?.length ?? 0;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      disabled={alreadyIn}
                      onClick={() => {
                        if (alreadyIn || !onQuickAddToCollection) return;
                        onQuickAddToCollection(col.id);
                        toast(`Added to "${col.name}"`);
                        setPanelCollectionOpen(false);
                        setPanelCollectionSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-2xs transition-colors",
                        alreadyIn
                          ? "cursor-default bg-white/[0.01] text-muted-foreground"
                          : "text-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="min-w-0">
                        <span className="block truncate">{col.name}</span>
                        <span className="text-[8px] text-muted-foreground">
                          {count} product{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <ScopeBadge scope={col.scope} teams={teams} />
                        {alreadyIn ? <Check className="h-3 w-3 text-[#5B8A6E]" /> : null}
                      </div>
                    </button>
                  );
                })}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPanelCollectionOpen(false);
                setPanelCollectionSearch("");
                if (onRequestCreateCollection) onRequestCreateCollection();
                else onOpenCollectionPicker();
              }}
              className="mt-1.5 h-8 w-full justify-start rounded-lg text-xs text-brand-cta/70 hover:bg-[rgba(201,169,110,0.04)] hover:text-brand-cta"
            >
              <Plus className="size-3.5" aria-hidden />
              New collection
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-stretch">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddToItinerary}
            className="h-8 flex-1 rounded-lg border border-brand-cta/20 bg-brand-cta/10 text-xs font-medium text-foreground hover:bg-brand-cta/15"
          >
            <Plus className="size-3.5" aria-hidden />
            Add to Itinerary
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (inlinePickerEnabled) {
                setPanelCollectionOpen((o) => {
                  const next = !o;
                  if (o) setPanelCollectionSearch("");
                  return next;
                });
              } else {
                onOpenCollectionPicker();
              }
            }}
            className={cn(
              "h-8 flex-1 rounded-lg text-xs font-medium",
              inlinePickerEnabled && panelCollectionOpen
                ? "border-brand-cta/20 bg-brand-cta/10 text-brand-cta"
                : "border-border bg-white/[0.03] hover:bg-white/[0.06]"
            )}
          >
            <Bookmark className="size-3.5" aria-hidden />
            Add to Collection
          </Button>
          <Button variant="outline" size="sm" className="h-8 flex-1 rounded-lg text-xs font-medium" asChild>
            <Link href={`/dashboard/products/${product.id}`}>
              <ExternalLink className="size-3.5" aria-hidden />
              Full page
            </Link>
          </Button>
        </div>
      </div>

      {upgradeConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-border bg-popover p-5 shadow-2xl">
            <h3 className="mb-2 text-sm font-medium text-foreground">Suggest to agency?</h3>
            <div className="mb-3 rounded-lg border border-border bg-[rgba(255,255,255,0.03)] p-2.5">
              <p className="line-clamp-3 text-xs italic text-muted-foreground">&quot;{upgradeConfirmText}&quot;</p>
            </div>
            <p className="mb-4 text-2xs leading-relaxed text-muted-foreground">
              Needs admin approval. Your private note is unchanged.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setUpgradeConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="cta" size="sm" className="h-8 text-xs text-[#08080c]" onClick={confirmUpgrade}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {contactUpgradeOpen && contactUpgradeTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-border bg-popover p-5 shadow-2xl">
            <h3 className="mb-2 text-sm font-medium text-foreground">Share contact with agency?</h3>
            <div className="mb-3 rounded-lg border border-white/[0.04] bg-white/[0.03] p-2.5">
              <p className="text-xs font-medium text-foreground">{contactUpgradeTarget.name}</p>
              <p className="text-2xs text-muted-foreground">{contactUpgradeTarget.role}</p>
              <p className="text-2xs text-muted-foreground">
                {contactUpgradeTarget.email.trim() || "—"}
              </p>
            </div>
            <p className="mb-1 text-2xs leading-relaxed text-muted-foreground">
              This contact will be submitted for admin approval before becoming visible to the team.
            </p>
            <p className="mb-4 text-2xs leading-relaxed text-muted-foreground">
              Your private contact will remain intact.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setContactUpgradeOpen(false);
                  setContactUpgradeTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="cta" size="sm" className="h-8 text-xs text-[#08080c]" onClick={confirmContactUpgrade}>
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
