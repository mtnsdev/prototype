"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bookmark,
  Building2,
  Check,
  Clock,
  Contact,
  ExternalLink,
  Lock,
  Pencil,
  Plus,
  Search,
  Share2,
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
} from "@/types/product-directory";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import type { Team } from "@/types/teams";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { AMENITY_LABELS } from "./productDirectoryFilterConfig";
import { directoryTierLabel, directoryTierStars } from "./productDirectoryDetailMeta";
import { relativeTime } from "./productDirectoryRelativeTime";
import { DIRECTORY_PRODUCT_TYPE_CONFIG } from "./productDirectoryProductTypes";
import {
  directoryCategoryColors,
  directoryProductGalleryImages,
  directoryProductPlaceLabel,
} from "./productDirectoryVisual";
import {
  directoryProductPartnerProgramsSyncPatch,
  programFilterId,
  programDisplayCommissionRate,
  programDisplayName,
} from "./productDirectoryCommission";
import { getProductLayerMock } from "./ProductDetail/productLayerMock";

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
  const [personalRating, setPersonalRating] = useState(0);
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

  useEffect(() => {
    setPanelCollectionOpen(false);
    setPanelCollectionSearch("");
    setPartnerProgramsEditMode(false);
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
  }, [product.id]);

  useEffect(() => {
    setLocalPartnerPrograms(clonePartnerProgramsForEdit(product.partnerPrograms));
  }, [product.id]);

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
    setPersonalRating(detailMock.advisorDefaults.personalRating);
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
    const author = user?.username ?? user?.email ?? "You";
    setAgencyNotes((prev) => [
      {
        id: `n_${Date.now()}`,
        authorName: author,
        authorId: currentUserId,
        text: t,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewAgencyNote("");
    toast("Note posted");
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
    const row: DirectoryAgencyContact = {
      id: editId ?? `c_${Date.now()}`,
      name,
      role,
      email: newAgencyContactEmail.trim() || "—",
      phone: newAgencyContactPhone.trim() || "—",
      note: newAgencyContactNote.trim() || undefined,
      addedBy: prev?.addedBy ?? (user?.username ?? user?.email ?? "You"),
      addedById: prev?.addedById ?? currentUserId,
      pendingUpgrade: prev?.pendingUpgrade,
      upgradedById: prev?.upgradedById,
      upgradedByName: prev?.upgradedByName,
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

  const cat = directoryCategoryColors(product.type);
  const typeEntry = DIRECTORY_PRODUCT_TYPE_CONFIG.find((t) => t.id === product.type);
  const TypeIcon = typeEntry?.icon ?? Building2;
  const placeLine =
    product.city && product.country ? `${product.city}, ${product.country}` : directoryProductPlaceLabel(product);

  const tierStars = directoryTierStars(product.tier);
  const enrichment = Math.min(5, Math.max(0, product.enrichmentScore ?? 0));
  const galleryImages = useMemo(
    () => directoryProductGalleryImages(product),
    [product.id, product.imageUrl, product.imageGalleryUrls]
  );

  const showPartnerProgramEditor = isAdmin && partnerProgramsEditMode;

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
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white"
            aria-label="Close panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
              style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
            >
              <TypeIcon className="h-2.5 w-2.5 shrink-0" />
              {typeEntry?.label ?? product.type}
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
      {/* Block 2 — Quick Facts */}
      <div className="relative z-10 -mt-2 rounded-xl border border-border bg-white/[0.03] p-3">
        <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Type</p>
            <p className="mt-0.5 text-xs font-medium text-foreground">
              {typeEntry?.label ?? product.type}
            </p>
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

          {product.type === "hotel" && (
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
          {product.type === "restaurant" && (
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
          {product.type === "experience" && (
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
          {product.type === "cruise" && (
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
          {product.type === "dmc" && (
            <div className="col-span-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Destinations</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{product.destinations ?? "—"}</p>
            </div>
          )}
          {product.type === "villa" && (
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
          {product.type === "wellness" && (
            <div className="col-span-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Specialty</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{product.specialty ?? "—"}</p>
            </div>
          )}
          {product.type === "transport" && (
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
              <button
                type="button"
                onClick={cancelPartnerProgramsEdit}
                className="shrink-0 rounded-lg border border-border bg-white/[0.04] px-2.5 py-1 text-2xs text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
              >
                Cancel editing
              </button>
            ) : (
              <button
                type="button"
                onClick={beginPartnerProgramsEdit}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-brand-cta/35 bg-[rgba(201,169,110,0.08)] px-2.5 py-1 text-2xs text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.14)]"
              >
                <Pencil className="h-3 w-3" aria-hidden />
                Edit programs
              </button>
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
                        <button
                          type="button"
                          onClick={() => removeProgramAt(index)}
                          className="flex items-center gap-1 text-[9px] text-[#A66B6B]/80 transition-colors hover:text-[#A66B6B]"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
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
                          <span className="mb-0.5 block text-[9px] text-muted-foreground">Commission %</span>
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
              <button
                type="button"
                className="w-full rounded-lg border border-brand-cta bg-[rgba(201,169,110,0.1)] px-3 py-2 text-xs font-medium text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.15)]"
                onClick={addPartnerProgram}
              >
                + Link program
              </button>
              {localPartnerPrograms.length > 0 ? (
                <button
                  type="button"
                  onClick={savePartnerProgramsFromState}
                  className="w-full rounded-lg border border-border bg-white/[0.06] px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.09]"
                >
                  Save all program changes
                </button>
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
                              <span className="font-semibold text-brand-cta">{pr.effectiveRate}%</span> · book{" "}
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
                      {program.lastEditedAt
                        ? ` · ${new Date(program.lastEditedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                  ) : null}
                  {showFooter ? (
                    <div className="flex items-center gap-3 border-t border-white/[0.04] bg-white/[0.015] px-3 py-2">
                      {canViewCommissions && displayRate != null ? (
                        <span className="text-xs font-semibold text-[#B8976E]">{displayRate}%</span>
                      ) : null}
                      {program.expiryDate != null && program.expiryDate !== "" ? (
                        <span
                          className={cn(
                            "ml-auto text-[9px]",
                            isExpiring ? "text-[var(--color-warning)]" : "text-muted-foreground"
                          )}
                        >
                          {isExpiring ? "Expires " : "Until "}
                          {new Date(program.expiryDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
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
            <button
              type="button"
              onClick={openPersonalContactFormForAdd}
              className="flex items-center gap-1 text-[9px] text-[rgba(160,140,180,0.55)] transition-colors hover:text-[rgba(160,140,180,0.85)]"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
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
                    <button
                      type="button"
                      onClick={() => requestContactUpgrade(c)}
                      className="mt-1.5 flex items-center gap-1 text-[9px] text-muted-foreground transition-colors hover:text-brand-cta"
                    >
                      <Share2 className="h-3 w-3 shrink-0" />
                      Suggest to agency…
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => openPersonalContactFormForEdit(c)}
                      className="flex items-center gap-0.5 text-[9px] text-muted-foreground/65 transition-colors hover:text-brand-cta"
                    >
                      <Pencil className="h-2.5 w-2.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removePersonalContact(c.id)}
                      className="text-[9px] text-[#A66B6B]/60 transition-colors hover:text-[#A66B6B]"
                    >
                      Remove
                    </button>
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
                <button
                  type="button"
                  disabled={!pcName.trim() || !pcRole.trim()}
                  onClick={savePersonalContact}
                  className="text-2xs text-[rgba(160,140,180,0.75)] transition-colors hover:text-[rgba(160,140,180,1)] disabled:opacity-30"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPersonalContactFormOpen(false);
                    setEditingPersonalContactId(null);
                    setPcName("");
                    setPcRole("");
                    setPcEmail("");
                    setPcPhone("");
                    setPcNote("");
                  }}
                  className="text-2xs text-muted-foreground transition-colors hover:text-muted-foreground"
                >
                  Cancel
                </button>
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
            <button
              type="button"
              onClick={openAgencyContactFormForAdd}
              className="flex items-center gap-1 text-[9px] text-[rgba(140,160,180,0.5)] transition-colors hover:text-[rgba(140,160,180,0.8)]"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          {agencyContacts.length === 0 ? (
            <div className="rounded-xl border border-white/[0.03] bg-white/[0.015] py-5 text-center">
              <UserPlus className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground/65" />
              <p className="text-2xs text-muted-foreground">None yet</p>
              <button
                type="button"
                onClick={openAgencyContactFormForAdd}
                className="mt-1.5 text-[9px] text-[rgba(140,160,180,0.5)] transition-colors hover:text-[rgba(140,160,180,0.8)]"
              >
                Add contact
              </button>
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
                    </div>
                    {canEdit ? (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => openAgencyContactFormForEdit(c)}
                          className="flex items-center gap-0.5 text-[9px] text-muted-foreground/65 transition-colors hover:text-brand-cta"
                        >
                          <Pencil className="h-2.5 w-2.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAgencyContact(c.id)}
                          className="text-[9px] text-[#A66B6B]/60 transition-colors hover:text-[#A66B6B]"
                        >
                          Remove
                        </button>
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
                <button
                  type="button"
                  disabled={!newAgencyContactName.trim() || !newAgencyContactRole.trim()}
                  onClick={saveAgencyContact}
                  className="text-2xs text-[rgba(140,160,180,0.7)] transition-colors hover:text-[rgba(140,160,180,1)] disabled:opacity-30"
                >
                  Save contact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAgencyContactFormOpen(false);
                    setEditingAgencyContactId(null);
                    setNewAgencyContactName("");
                    setNewAgencyContactRole("");
                    setNewAgencyContactEmail("");
                    setNewAgencyContactPhone("");
                    setNewAgencyContactNote("");
                  }}
                  className="text-2xs text-muted-foreground transition-colors hover:text-muted-foreground"
                >
                  Cancel
                </button>
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
                        <button
                          type="button"
                          onClick={savePersonalNoteEdit}
                          className="text-[9px] text-[#5B8A6E] hover:text-[#6DA07E]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPersonalNoteId(null);
                            setEditPersonalNoteDraft("");
                          }}
                          className="text-[9px] text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs leading-relaxed text-[#C8C0B8]">{note.text}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[9px] text-muted-foreground/65">{relativeTime(note.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPersonalNoteId(note.id);
                            setEditPersonalNoteDraft(note.text);
                          }}
                          className="flex items-center gap-0.5 text-[9px] text-muted-foreground/65 hover:text-brand-cta"
                        >
                          <Pencil className="h-2.5 w-2.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removePersonalNote(note.id)}
                          className="text-[9px] text-[#A66B6B]/60 hover:text-[#A66B6B]"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => requestUpgradeToAgency(note.text)}
                          className="ml-auto flex items-center gap-1 text-[9px] text-muted-foreground transition-colors hover:text-brand-cta"
                        >
                          <Share2 className="h-3 w-3 shrink-0" />
                          Suggest to agency
                        </button>
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
            <button
              type="button"
              onClick={addPersonalNote}
              className="self-end px-2 text-2xs text-[rgba(160,140,180,0.65)] transition-colors hover:text-[rgba(160,140,180,0.9)]"
            >
              Add
            </button>
          </div>

          <div className="mt-3 border-t border-white/[0.05] pt-3">
            <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">My rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPersonalRating(star)}
                  className={cn(
                    "h-5 w-5 text-xs",
                    star <= personalRating ? "text-brand-cta" : "text-[#2A2520]"
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/65">Agency</span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        <div className="rounded-xl border border-[rgba(140,160,180,0.10)] bg-[rgba(140,160,180,0.03)] p-3">
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
                          <button
                            type="button"
                            className="text-[#5B8A6E] hover:text-[#6DA07E]"
                            onClick={() => approveUpgrade(note.id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="text-[#A66B6B] hover:text-[#BA7E7E]"
                            onClick={() => rejectUpgrade(note.id)}
                          >
                            Reject
                          </button>
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
                        <button
                          type="button"
                          onClick={saveAgencyNoteEdit}
                          className="text-[9px] text-[#5B8A6E] hover:text-[#6DA07E]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAgencyNoteId(null);
                            setEditAgencyNoteDraft("");
                          }}
                          className="text-[9px] text-muted-foreground"
                        >
                          Cancel
                        </button>
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
                          <button
                            type="button"
                            className="flex items-center gap-0.5 text-muted-foreground/65 transition-colors hover:text-brand-cta"
                            onClick={() => {
                              setEditingAgencyNoteId(note.id);
                              setEditAgencyNoteDraft(note.text);
                            }}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground/65 transition-colors hover:text-brand-cta"
                            onClick={() => deleteAgencyNote(note.id)}
                          >
                            Delete
                          </button>
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
            <button
              type="button"
              onClick={postAgencyNote}
              className="self-center px-3 text-xs transition-colors"
              style={{ color: "rgba(140,160,180,0.60)" }}
            >
              Post
            </button>
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
                <button
                  type="button"
                  className="text-muted-foreground/65 transition-colors hover:text-brand-cta"
                  onClick={() => removeFromCollection(collection.id)}
                >
                  Remove
                </button>
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
              <button
                type="button"
                onClick={() => {
                  setPanelCollectionOpen(false);
                  setPanelCollectionSearch("");
                }}
                className="text-[9px] text-muted-foreground transition-colors hover:text-muted-foreground"
              >
                Cancel
              </button>
            </div>
            <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2 py-1.5">
              <Search className="h-3 w-3 shrink-0 text-muted-foreground/65" />
              <input
                value={panelCollectionSearch}
                onChange={(e) => setPanelCollectionSearch(e.target.value)}
                placeholder="Search collections..."
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
            <button
              type="button"
              onClick={() => {
                setPanelCollectionOpen(false);
                setPanelCollectionSearch("");
                if (onRequestCreateCollection) onRequestCreateCollection();
                else onOpenCollectionPicker();
              }}
              className="mt-1.5 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-2xs text-brand-cta/60 transition-colors hover:bg-[rgba(201,169,110,0.04)] hover:text-brand-cta"
            >
              <Plus className="h-3 w-3 shrink-0" />
              New collection
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={onAddToItinerary}
            className="flex-1 rounded-lg border border-brand-cta/20 bg-brand-cta/10 py-2 text-center text-2xs font-medium text-foreground transition-colors hover:bg-brand-cta/15"
          >
            Add to Itinerary
          </button>
        <button
          type="button"
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
              "flex-1 rounded-lg border py-2 text-center text-2xs font-medium transition-colors",
              inlinePickerEnabled && panelCollectionOpen
                ? "border-brand-cta/20 bg-brand-cta/10 text-brand-cta"
                : "border-border bg-white/[0.03] text-foreground hover:bg-white/[0.06]"
            )}
          >
            Add to Collection
        </button>
          <Link
            href={`/dashboard/products/${product.id}`}
            className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] py-2 text-center text-2xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            Full Page →
          </Link>
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
              <button
                type="button"
                className="px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setUpgradeConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-medium text-[#08080c] transition-colors hover:bg-brand-cta-hover"
                onClick={confirmUpgrade}
              >
                Submit
              </button>
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
              <button
                type="button"
                className="px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => {
                  setContactUpgradeOpen(false);
                  setContactUpgradeTarget(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#08080c] transition-colors hover:opacity-90"
                style={{ background: "#C9A96E" }}
                onClick={confirmContactUpgrade}
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
