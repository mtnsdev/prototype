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
  Lock,
  Pin,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import type { Team } from "@/types/teams";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { AMENITY_LABELS } from "./productDirectoryFilterConfig";
import {
  DIRECTORY_TIER_LEVELS,
  directoryTierLabel,
  directoryTierStars,
  type DirectoryPriceTier,
  type DirectoryTierLevel,
} from "./productDirectoryDetailMeta";
import { relativeTime } from "./productDirectoryRelativeTime";
import {
  dmcOperationalDataPresent,
  getPrimaryDirectoryType,
  isDMCProduct,
  normalizeDirectoryProductTypes,
} from "@/components/products/directoryProductTypeHelpers";
import { DIRECTORY_PRODUCT_TYPE_CONFIG, directoryCategoryLabel } from "./productDirectoryProductTypes";
import { getRepFirmByIdWithOverlay } from "./productDirectoryRepFirmMock";
import { RepFirmContactsLuxReadonlyTable } from "@/components/products/rep-firms/RepFirmContactsLuxTable";
import {
  directoryCategoryColors,
  directoryProductGalleryImages,
  directoryProductPlaceLabel,
  directoryProductPriceBandsNormalized,
  directoryProductPriceDisplay,
} from "./productDirectoryVisual";
import {
  getTopBookableProgramByCommission,
  programFilterId,
  programDisplayCommissionRate,
  programDisplayName,
} from "./productDirectoryCommission";
import { getProductLayerMock } from "./ProductDetail/productLayerMock";
import { formatProductOpeningLine } from "@/lib/productDirectoryOpening";
import {
  defaultChannelFormRows,
  emailsForContact,
  persistedContactChannels,
  phonesForContact,
} from "@/lib/directoryAgencyContactChannels";

const DIRECTORY_PRICE_BAND_OPTIONS: DirectoryPriceTier[] = ["$", "$$", "$$$", "$$$$", "$$$$$"];

/** Repeating email / phone rows for agency & private contact forms. */
function ContactChannelFormFields({
  emailRows,
  phoneRows,
  onEmailChange,
  onPhoneChange,
  onAddEmail,
  onAddPhone,
  onRemoveEmail,
  onRemovePhone,
}: {
  emailRows: string[];
  phoneRows: string[];
  onEmailChange: (index: number, value: string) => void;
  onPhoneChange: (index: number, value: string) => void;
  onAddEmail: () => void;
  onAddPhone: () => void;
  onRemoveEmail: (index: number) => void;
  onRemovePhone: (index: number) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <span className="text-[9px] font-medium text-muted-foreground">Email addresses</span>
        {emailRows.map((val, i) => (
          <div key={`em-${i}`} className="flex min-w-0 gap-1.5">
            <input
              value={val}
              onChange={(e) => onEmailChange(i, e.target.value)}
              placeholder="Email address (optional)"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="min-w-0 flex-1 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
            />
            {emailRows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Remove this email address"
                onClick={() => onRemoveEmail(i)}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onAddEmail}
          className="h-7 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Plus className="mr-1 size-3 opacity-70" aria-hidden />
          Add another email address
        </Button>
      </div>
      <div className="space-y-1.5">
        <span className="text-[9px] font-medium text-muted-foreground">Phone numbers</span>
        {phoneRows.map((val, i) => (
          <div key={`ph-${i}`} className="flex min-w-0 gap-1.5">
            <input
              value={val}
              onChange={(e) => onPhoneChange(i, e.target.value)}
              placeholder="Phone number (optional)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="min-w-0 flex-1 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[rgba(245,240,235,0.7)] outline-none placeholder:text-muted-foreground/65"
            />
            {phoneRows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Remove this phone number"
                onClick={() => onRemovePhone(i)}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onAddPhone}
          className="h-7 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Plus className="mr-1 size-3 opacity-70" aria-hidden />
          Add another phone number
        </Button>
      </div>
    </>
  );
}

function normalizeGalleryUrlList(urls: string[]): string[] {
  return urls.map((u) => u.trim()).filter(Boolean);
}

function agencyMocksToDirectoryNotes(
  mocks: { id: string; content: string; author: string; timeAgo: string; pinned?: boolean }[]
): DirectoryAgencyNote[] {
  return mocks.map((n) => ({
    id: n.id,
    authorName: n.author,
    authorId: `mock-${n.id}`,
    text: n.content,
    createdAt: new Date().toISOString(),
    pinned: n.pinned,
  }));
}

function TeamScopedFieldNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/80">
      <Lock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      View only
    </span>
  );
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

function dmcOperationsField(label: string, value: string | number | null | undefined) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.4)]">
        {label}
      </p>
      <p className="text-[13px] text-[#F5F5F5]">
        {value != null && String(value).trim() !== "" ? String(value) : "—"}
      </p>
    </div>
  );
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
  const [pcEmails, setPcEmails] = useState<string[]>(() => defaultChannelFormRows().emails);
  const [pcPhones, setPcPhones] = useState<string[]>(() => defaultChannelFormRows().phones);
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
    emails: string[];
    phones: string[];
    note?: string;
  } | null>(null);
  const [agencyContacts, setAgencyContacts] = useState<DirectoryAgencyContact[]>(product.agencyContacts);
  const [agencyContactFormOpen, setAgencyContactFormOpen] = useState(false);
  const [editingAgencyContactId, setEditingAgencyContactId] = useState<string | null>(null);
  const [newAgencyContactName, setNewAgencyContactName] = useState("");
  const [newAgencyContactRole, setNewAgencyContactRole] = useState("");
  const [newAgencyContactEmails, setNewAgencyContactEmails] = useState<string[]>(() =>
    defaultChannelFormRows().emails,
  );
  const [newAgencyContactPhones, setNewAgencyContactPhones] = useState<string[]>(() =>
    defaultChannelFormRows().phones,
  );
  const [newAgencyContactNote, setNewAgencyContactNote] = useState("");
  const [panelCollectionOpen, setPanelCollectionOpen] = useState(false);
  const [panelCollectionSearch, setPanelCollectionSearch] = useState("");
  const [showRepFirmEditor, setShowRepFirmEditor] = useState(false);
  const [repFirmSuggestOpen, setRepFirmSuggestOpen] = useState(false);
  const [repFirmSuggestText, setRepFirmSuggestText] = useState("");
  const [localRepFirmLinks, setLocalRepFirmLinks] = useState<RepFirmProductLink[]>([]);
  const [enableMasterDetailsOpen, setEnableMasterDetailsOpen] = useState(false);

  const productTypesSig = product.types.join("|");
  const [typesDraft, setTypesDraft] = useState<DirectoryProductCategory[]>(() => [...product.types]);
  const [openingDateDraft, setOpeningDateDraft] = useState(() =>
    product.openingDate ? product.openingDate.slice(0, 10) : ""
  );
  const [openingLabelDraft, setOpeningLabelDraft] = useState(() => product.openingLabel ?? "");
  const [nameDraft, setNameDraft] = useState(() => product.name);
  const [descriptionDraft, setDescriptionDraft] = useState(() => product.description);
  const [tierDraft, setTierDraft] = useState<DirectoryTierLevel>(() => product.tier ?? "unrated");
  const [priceBandsDraft, setPriceBandsDraft] = useState<DirectoryPriceTier[]>(() =>
    directoryProductPriceBandsNormalized(product)
  );
  const [heroDraft, setHeroDraft] = useState(() => product.imageUrl ?? "");
  const [galleryDrafts, setGalleryDrafts] = useState<string[]>(() =>
    normalizeGalleryUrlList([...(product.imageGalleryUrls ?? [])]).slice(0, 5)
  );

  useEffect(() => {
    setNameDraft(product.name);
    setDescriptionDraft(product.description);
    setTierDraft(product.tier ?? "unrated");
    setPriceBandsDraft(directoryProductPriceBandsNormalized(product));
    setHeroDraft(product.imageUrl ?? "");
    setGalleryDrafts(normalizeGalleryUrlList([...(product.imageGalleryUrls ?? [])]).slice(0, 5));
  }, [product.id]);

  useEffect(() => {
    if (!enableMasterDetailsOpen) return;
    setNameDraft(product.name);
    setDescriptionDraft(product.description);
    setTierDraft(product.tier ?? "unrated");
    setPriceBandsDraft(directoryProductPriceBandsNormalized(product));
    setHeroDraft(product.imageUrl ?? "");
    setGalleryDrafts(normalizeGalleryUrlList([...(product.imageGalleryUrls ?? [])]).slice(0, 5));
    setTypesDraft([...product.types]);
    setOpeningDateDraft(product.openingDate ? product.openingDate.slice(0, 10) : "");
    setOpeningLabelDraft(product.openingLabel ?? "");
    // Intentionally only when toggling the editor — avoids resetting drafts on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `product` read when editor opens
  }, [enableMasterDetailsOpen]);

  useEffect(() => {
    setTypesDraft([...product.types]);
  }, [product.id, productTypesSig]);

  useEffect(() => {
    setOpeningDateDraft(product.openingDate ? product.openingDate.slice(0, 10) : "");
    setOpeningLabelDraft(product.openingLabel ?? "");
  }, [product.id, product.openingDate, product.openingLabel]);

  const normalizedTypesDraftSig = useMemo(
    () => normalizeDirectoryProductTypes(typesDraft).join("|"),
    [typesDraft]
  );
  const normalizedProductTypesSig = useMemo(
    () => normalizeDirectoryProductTypes(product.types).join("|"),
    [productTypesSig]
  );
  const typesDirty = normalizedTypesDraftSig !== normalizedProductTypesSig;

  const openingDirty = useMemo(() => {
    const pDate = product.openingDate ? product.openingDate.slice(0, 10) : "";
    const dDate = openingDateDraft.trim();
    const datePart = dDate !== pDate;
    const labelPart = (openingLabelDraft.trim() || null) !== (product.openingLabel?.trim() || null);
    return datePart || labelPart;
  }, [openingDateDraft, openingLabelDraft, product.openingDate, product.openingLabel]);

  const coreCatalogDirty = useMemo(() => {
    if (nameDraft.trim() !== product.name.trim()) return true;
    if (descriptionDraft !== product.description) return true;
    if (tierDraft !== (product.tier ?? "unrated")) return true;
    const pBands = directoryProductPriceBandsNormalized(product);
    if (JSON.stringify(priceBandsDraft) !== JSON.stringify(pBands)) return true;
    if ((heroDraft.trim() || "") !== (product.imageUrl?.trim() || "")) return true;
    const gNew = normalizeGalleryUrlList(galleryDrafts);
    const gOld = normalizeGalleryUrlList([...(product.imageGalleryUrls ?? [])]);
    if (JSON.stringify(gNew) !== JSON.stringify(gOld)) return true;
    return false;
  }, [
    nameDraft,
    descriptionDraft,
    tierDraft,
    priceBandsDraft,
    heroDraft,
    galleryDrafts,
    product.name,
    product.description,
    product.tier,
    product.imageUrl,
    product.imageGalleryUrls,
    product.priceBands,
    product.priceTier,
  ]);

  const masterDetailsDirty = coreCatalogDirty || typesDirty || openingDirty;

  const saveEnableMasterDetails = () => {
    const name = nameDraft.trim();
    if (!name) {
      toast({ title: "Product name is required", tone: "destructive" });
      return;
    }
    const hero = heroDraft.trim();
    if (!hero) {
      toast({ title: "Hero image URL is required", tone: "destructive" });
      return;
    }
    const next = normalizeDirectoryProductTypes(typesDraft);
    if (next.length === 0) {
      toast({ title: "Select at least one category", tone: "destructive" });
      return;
    }
    const nextBands = priceBandsDraft.slice(0, 5);
    const nextGallery = normalizeGalleryUrlList(galleryDrafts).slice(0, 5);
    const nextOpeningDate = openingDateDraft.trim() || null;
    const nextOpeningLabel = openingLabelDraft.trim() || null;
    onPatchProduct(product.id, {
      name,
      description: descriptionDraft.trim(),
      tier: tierDraft,
      priceBands: nextBands.length > 0 ? nextBands : undefined,
      priceTier: nextBands[0] ?? undefined,
      imageUrl: hero,
      imageGalleryUrls: nextGallery.length > 0 ? nextGallery : undefined,
      types: next,
      openingDate: nextOpeningDate,
      openingLabel: nextOpeningLabel,
      updatedAt: new Date().toISOString(),
    });
    toast({ title: "Enable directory record updated", tone: "success" });
    setEnableMasterDetailsOpen(false);
  };

  const cancelEnableMasterDetails = () => {
    setNameDraft(product.name);
    setDescriptionDraft(product.description);
    setTierDraft(product.tier ?? "unrated");
    setPriceBandsDraft(directoryProductPriceBandsNormalized(product));
    setHeroDraft(product.imageUrl ?? "");
    setGalleryDrafts(normalizeGalleryUrlList([...(product.imageGalleryUrls ?? [])]).slice(0, 5));
    setTypesDraft([...product.types]);
    setOpeningDateDraft(product.openingDate ? product.openingDate.slice(0, 10) : "");
    setOpeningLabelDraft(product.openingLabel ?? "");
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
  useEffect(() => {
    setPanelCollectionOpen(false);
    setPanelCollectionSearch("");
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
    setLocalRepFirmLinks((product.repFirmLinks ?? []).map((l) => ({ ...l })));
  }, [product.id, product.repFirmLinks]);

  useEffect(() => {
    if (!isAdmin && showRepFirmEditor) {
      setShowRepFirmEditor(false);
      setLocalRepFirmLinks((product.repFirmLinks ?? []).map((l) => ({ ...l })));
    }
  }, [isAdmin, showRepFirmEditor, product.repFirmLinks]);

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
    setAgencyNotes((prev) => [
      {
        id: `n_${Date.now()}`,
        authorName: displayName,
        authorId: currentUserId,
        text: t,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewAgencyNote("");
    toast("Note posted");
  };

  const toggleAgencyNotePin = (noteId: string) => {
    if (!isAdmin) return;
    setAgencyNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n))
    );
    toast("Note updated");
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
    const empty = defaultChannelFormRows();
    setPcEmails(empty.emails);
    setPcPhones(empty.phones);
    setPcNote("");
    setPersonalContactFormOpen(true);
  };

  const openPersonalContactFormForEdit = (c: DirectoryAgencyContact) => {
    setEditingPersonalContactId(c.id);
    setPcName(c.name);
    setPcRole(c.role);
    const em = emailsForContact(c);
    const ph = phonesForContact(c);
    setPcEmails(em.length ? em : [""]);
    setPcPhones(ph.length ? ph : [""]);
    setPcNote(c.note ?? "");
    setPersonalContactFormOpen(true);
  };

  const savePersonalContact = () => {
    const name = pcName.trim();
    const role = pcRole.trim();
    if (!name || !role) return;
    const channels = persistedContactChannels(pcEmails, pcPhones);
    const row: DirectoryAgencyContact = {
      id: editingPersonalContactId ?? `pc_${Date.now()}`,
      name,
      role,
      ...channels,
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
    const empty = defaultChannelFormRows();
    setPcEmails(empty.emails);
    setPcPhones(empty.phones);
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
    const empty = defaultChannelFormRows();
    setNewAgencyContactEmails(empty.emails);
    setNewAgencyContactPhones(empty.phones);
    setNewAgencyContactNote("");
    setAgencyContactFormOpen(true);
  };

  const openAgencyContactFormForEdit = (c: DirectoryAgencyContact) => {
    setEditingAgencyContactId(c.id);
    setNewAgencyContactName(c.name);
    setNewAgencyContactRole(c.role);
    const em = emailsForContact(c);
    const ph = phonesForContact(c);
    setNewAgencyContactEmails(em.length ? em : [""]);
    setNewAgencyContactPhones(ph.length ? ph : [""]);
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
      emails: emailsForContact(contact),
      phones: phonesForContact(contact),
      note: contact.note,
    });
    setContactUpgradeOpen(true);
  };

  const confirmContactUpgrade = () => {
    if (!contactUpgradeTarget) return;
    const displayName = user?.username ?? user?.email ?? "You";
    const channels = persistedContactChannels(contactUpgradeTarget.emails, contactUpgradeTarget.phones);
    const row: DirectoryAgencyContact = {
      id: `ac-upgrade-${Date.now()}`,
      name: contactUpgradeTarget.name,
      role: contactUpgradeTarget.role,
      ...channels,
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
    const channels = persistedContactChannels(newAgencyContactEmails, newAgencyContactPhones);
    const row: DirectoryAgencyContact = {
      id: editId ?? `c_${Date.now()}`,
      name,
      role,
      ...channels,
      note: newAgencyContactNote.trim() || undefined,
      addedBy: prev?.addedBy ?? displayName,
      addedById: prev?.addedById ?? currentUserId,
      addedAt: prev?.addedAt ?? new Date().toISOString(),
    };
    const next = editId ? agencyContacts.map((c) => (c.id === editId ? row : c)) : [...agencyContacts, row];
    setAgencyContacts(next);
    onPatchProduct(product.id, { agencyContacts: next });
    setNewAgencyContactName("");
    setNewAgencyContactRole("");
    const empty = defaultChannelFormRows();
    setNewAgencyContactEmails(empty.emails);
    setNewAgencyContactPhones(empty.phones);
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
  const openingLine = useMemo(() => formatProductOpeningLine(product), [product]);

  const tierStars = directoryTierStars(product.tier);
  const galleryImages = useMemo(
    () => directoryProductGalleryImages(product),
    [product.id, product.imageUrl, product.imageGalleryUrls]
  );
  const headerPriceDisplay = useMemo(() => directoryProductPriceDisplay(product), [product]);

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

  const beginRepFirmsEdit = () => {
    if (!isAdmin) return;
    setLocalRepFirmLinks((product.repFirmLinks ?? []).map((l) => ({ ...l })));
    setShowRepFirmEditor(true);
  };

  const cancelRepFirmsEdit = () => {
    setShowRepFirmEditor(false);
    setLocalRepFirmLinks([]);
  };

  const updateRepFirmLinkAt = (index: number, patch: Partial<RepFirmProductLink>) => {
    if (!isAdmin) return;
    setLocalRepFirmLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeRepFirmLinkAt = (index: number) => {
    if (!isAdmin) return;
    setLocalRepFirmLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const addRepFirmLink = () => {
    if (!isAdmin) return;
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
    if (!isAdmin) return;
    onPatchProduct(product.id, {
      repFirmLinks: localRepFirmLinks,
      repFirmCount: localRepFirmLinks.length,
    });
    toast("Rep firms saved");
    setShowRepFirmEditor(false);
  };

  return (
    <div className="flex min-h-0 min-w-0 w-full max-w-full flex-col pb-0">
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
            {headerPriceDisplay ? (
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {headerPriceDisplay}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold leading-tight text-white drop-shadow-sm">{product.name}</h2>
            {isAdmin ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-muted-foreground">
                Admin
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-white/70">{placeLine}</p>
          {openingLine ? (
            <p className="mt-1 text-[10px] font-medium text-[#C9A96E]">{openingLine}</p>
          ) : null}
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
            className="h-8 gap-1.5 rounded-lg border-border bg-foreground/[0.03] text-xs text-foreground hover:bg-white/[0.05]"
          >
            <Pencil className="size-3.5 shrink-0" aria-hidden />
            Edit product details (Enable)
          </Button>
        </div>
      ) : null}

      {isAdmin && enableMasterDetailsOpen ? (
        <div className="relative z-0 mt-1 rounded-xl border border-border/70 bg-card/50 p-4 shadow-sm">
          <div className="mb-4 border-b border-border/50 pb-3">
            <p className="text-xs font-medium text-foreground">Edit directory record</p>
            <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">
              Updates cards, filters, and map for everyone in the agency.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Basics</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="dir-product-name" className="text-2xs text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    id="dir-product-name"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="mt-1 h-9 border-border bg-background text-xs text-foreground"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="dir-product-desc" className="text-2xs text-muted-foreground">
                    Description
                  </Label>
                  <textarea
                    id="dir-product-desc"
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    rows={3}
                    placeholder="Short summary for listings…"
                    className="mt-1 min-h-[72px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-brand-cta/30"
                  />
                </div>
                <div>
                  <Label htmlFor="dir-product-tier" className="text-2xs text-muted-foreground">
                    Tier
                  </Label>
                  <select
                    id="dir-product-tier"
                    value={tierDraft}
                    onChange={(e) => setTierDraft(e.target.value as DirectoryTierLevel)}
                    className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {DIRECTORY_TIER_LEVELS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Price bands</p>
                <span className="text-[9px] text-muted-foreground/80">Max 5 · optional</span>
              </div>
              <p className="mb-2 text-[10px] leading-snug text-muted-foreground/90">
                Shown on cards; price filter matches if any band fits.
              </p>
              {priceBandsDraft.length < 5 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mb-2 h-7 w-full border-dashed text-2xs"
                  onClick={() =>
                    setPriceBandsDraft((prev) => [...prev, "$$$" as DirectoryPriceTier].slice(0, 5))
                  }
                >
                  <Plus className="mr-1 size-3 opacity-70" aria-hidden />
                  Add price band
                </Button>
              ) : null}
              {priceBandsDraft.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/70">None — no $ line on the card.</p>
              ) : (
                <ul className="space-y-1.5">
                  {priceBandsDraft.map((band, i) => (
                    <li key={i} className="flex min-w-0 items-center gap-1.5">
                      <select
                        value={band}
                        onChange={(e) =>
                          setPriceBandsDraft((prev) => {
                            const next = [...prev];
                            next[i] = e.target.value as DirectoryPriceTier;
                            return next;
                          })
                        }
                        className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none"
                      >
                        {DIRECTORY_PRICE_BAND_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                        aria-label="Remove band"
                        onClick={() => setPriceBandsDraft((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Images</p>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="dir-hero-url" className="text-2xs text-muted-foreground">
                    Hero (required)
                  </Label>
                  <Input
                    id="dir-hero-url"
                    value={heroDraft}
                    onChange={(e) => setHeroDraft(e.target.value)}
                    placeholder="https://…"
                    className="mt-1 h-8 border-border bg-background font-mono text-[11px] leading-tight text-foreground"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-2xs text-muted-foreground">Gallery (up to 5)</Label>
                    {galleryDrafts.length < 5 ? (
                      <button
                        type="button"
                        className="text-[10px] font-medium text-brand-cta/90 hover:text-brand-cta"
                        onClick={() => setGalleryDrafts((prev) => [...prev, ""].slice(0, 5))}
                      >
                        + Add URL
                      </button>
                    ) : null}
                  </div>
                  {galleryDrafts.length > 0 ? (
                    <ul className="mt-1.5 space-y-1.5">
                      {galleryDrafts.map((url, i) => (
                        <li key={i} className="flex min-w-0 items-center gap-1.5">
                          <Input
                            value={url}
                            onChange={(e) =>
                              setGalleryDrafts((prev) => {
                                const next = [...prev];
                                next[i] = e.target.value;
                                return next;
                              })
                            }
                            placeholder="https://…"
                            className="h-8 min-w-0 flex-1 border-border bg-background font-mono text-[11px] leading-tight text-foreground"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                            aria-label="Remove image URL"
                            onClick={() => setGalleryDrafts((prev) => prev.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[10px] text-muted-foreground/70">Optional extra thumbnails.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Categories & opening
              </p>
              <p className="mb-2 text-[10px] leading-snug text-muted-foreground/90">
                First selected type drives the badge; add types for filters.
              </p>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-full justify-between gap-2 rounded-md border-border bg-background px-3 text-left text-xs font-normal text-foreground"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {typesDraft.length === 0
                        ? "Select types…"
                        : typesDraft.map((t) => directoryCategoryLabel(t)).join(", ")}
                    </span>
                    <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="z-[100] w-[min(100vw-2rem,20rem)] max-h-[min(320px,50vh)] overflow-hidden p-2"
                >
                  <p className="mb-2 px-1 text-2xs text-muted-foreground">Pick at least one.</p>
                  <ul className="max-h-48 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
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
                <label className="mt-2 block">
                  <span className="text-2xs text-muted-foreground">Primary badge</span>
                  <select
                    className="mt-1 flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
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

              <div className="mt-3 border-t border-border/30 pt-3">
                <p className="mb-2 text-2xs font-medium text-muted-foreground">Planned opening (optional)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="dir-opening-date" className="text-[10px] text-muted-foreground">
                      Date
                    </Label>
                    <Input
                      id="dir-opening-date"
                      type="date"
                      value={openingDateDraft}
                      onChange={(e) => setOpeningDateDraft(e.target.value)}
                      className="mt-0.5 h-8 border-border bg-background text-xs text-foreground"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="dir-opening-label" className="text-[10px] text-muted-foreground">
                      Label
                    </Label>
                    <Input
                      id="dir-opening-label"
                      value={openingLabelDraft}
                      onChange={(e) => setOpeningLabelDraft(e.target.value)}
                      placeholder="e.g. Q2 2026 — overrides date on card"
                      className="mt-0.5 h-8 border-border bg-background text-xs text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-[1] -mx-4 mt-1 flex flex-wrap justify-end gap-2 border-t border-border/50 bg-card/85 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
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
              disabled={!masterDetailsDirty}
              onClick={saveEnableMasterDetails}
              className="h-8 rounded-lg text-xs"
            >
              Save changes
            </Button>
          </div>
        </div>
      ) : null}

      {/* Block 2 — Quick Facts */}
      <div className="relative z-10 mt-3 rounded-xl border border-border bg-white/[0.03] p-3">
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
            <p className="mt-0.5 text-xs font-medium text-foreground">{headerPriceDisplay ?? "—"}</p>
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
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Updated</p>
            <p className="mt-0.5 text-xs font-medium text-foreground">
              {product.updatedAt ? relativeTime(product.updatedAt) : "—"}
            </p>
          </div>
        </div>
      </div>

      {(isDMCProduct(product) || dmcOperationalDataPresent(product)) && (
        <div className="relative z-10 mt-4 border-t border-border pt-4">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#D4A574]">
            DMC Operations
          </p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.4)]">
                General Requests
              </p>
              {product.general_requests_email != null && String(product.general_requests_email).trim() !== "" ? (
                <a
                  href={`mailto:${product.general_requests_email}`}
                  className="text-[13px] text-[#D4A574] transition-colors hover:text-[#E5B87A]"
                >
                  {product.general_requests_email}
                </a>
              ) : (
                <p className="text-[13px] text-[#F5F5F5]">—</p>
              )}
            </div>
            {dmcOperationsField("Repped By", product.repped_by)}
            {dmcOperationsField("Pricing Model", product.pricing_model)}
            {dmcOperationsField("Payment Process", product.payment_process)}
            {dmcOperationsField("Commission Process", product.commission_process)}
            {dmcOperationsField("After Hours Support", product.after_hours_support)}
            {dmcOperationsField("Destinations Served", product.destinations_served)}
          </div>
        </div>
      )}

      {/* Block 3 — Description + Tags + Website */}
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-[rgba(245,240,235,0.75)]">{product.description}</p>
        {(product.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags!.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-foreground/[0.03] px-2 py-0.5 text-[9px] lowercase text-muted-foreground"
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

      {/* Block 4 — Partner Programs (read-only on product; edit in Partner Programs) */}
      <div className="border-t border-border pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Award className="h-3.5 w-3.5 shrink-0 text-brand-cta" />
            <span className="text-xs font-medium text-foreground">Partner Programs</span>
            <TeamScopedFieldNotice show={!isAdmin} />
            <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {product.partnerPrograms.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 rounded-lg border border-brand-cta/35 bg-[rgba(201,169,110,0.08)] text-xs text-brand-cta hover:bg-[rgba(201,169,110,0.14)]"
            >
              <Link href="/dashboard/products?tab=partner">Partner Programs</Link>
            </Button>
          </div>
        </div>
        {canViewCommissions ? (
          <p className="mb-2 text-[9px] leading-snug text-muted-foreground">
            Each program shows a <span className="text-foreground/90">guaranteed base</span> first, then{" "}
            <span className="text-foreground/90">temporary incentives</span> (booking / travel windows) — never added into one
            headline number.
          </p>
        ) : null}

        {product.partnerPrograms.length === 0 ? (
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
              const showCommissionPublic = canViewCommissions && displayRate != null;
              const showLockedCommissionHint = !canViewCommissions && active && displayRate != null;
              const showExpiryFooter = program.expiryDate != null && program.expiryDate !== "";
              const incentiveCount = program.activeIncentives?.length ?? 0;
              const showFooter = showLockedCommissionHint || showExpiryFooter;
              return (
                <div
                  key={program.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-white/[0.05] bg-foreground/[0.03]",
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
                  {showCommissionPublic ? (
                    <div className="border-b border-white/[0.06] bg-foreground/[0.03] px-3 py-2">
                      <p className="text-[8px] font-medium uppercase tracking-wider text-[#B8976E]">
                        Guaranteed base rate
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-[#B8976E]">
                        {program.commissionType === "flat" ? `$${displayRate}` : `${displayRate}%`}
                      </p>
                    </div>
                  ) : null}
                  {incentiveCount > 0 ? (
                    <div className="border-b border-white/[0.04] px-3 py-2">
                      <p className="mb-1 text-[8px] font-medium uppercase tracking-wider text-[#B8976E]">
                        Temporary incentives
                      </p>
                      <p className="mb-2 text-[9px] leading-snug text-muted-foreground">
                        Separate from the base — eligibility depends on booking and travel windows.
                      </p>
                      <ul className="space-y-2 text-[9px] text-muted-foreground">
                        {program.activeIncentives!.map((pr) => (
                          <li key={pr.id} className="space-y-1 rounded-lg border border-white/[0.06] bg-foreground/[0.03] p-2">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="font-semibold text-brand-cta">
                                {(pr.rateType ?? "percentage") === "flat"
                                  ? `$${pr.effectiveRate}`
                                  : `${pr.effectiveRate}%`}
                              </span>
                              {pr.title?.trim() ? (
                                <span className="text-2xs font-medium text-foreground">{pr.title.trim()}</span>
                              ) : null}
                            </div>
                            <p className="text-[9px]">
                              <span className="text-muted-foreground">Book: </span>
                              {pr.bookingStart || pr.bookingEnd ? (
                                <>
                                  {pr.bookingStart?.slice(0, 10) ?? "—"}
                                  {pr.bookingEnd ? ` → ${pr.bookingEnd.slice(0, 10)}` : ""}
                                </>
                              ) : (
                                "Open"
                              )}
                            </p>
                            {(pr.travelStart || pr.travelEnd) ? (
                              <p className="text-[9px]">
                                <span className="text-muted-foreground">Travel: </span>
                                {pr.travelStart?.slice(0, 10) ?? "—"}
                                {pr.travelEnd ? ` → ${pr.travelEnd.slice(0, 10)}` : ""}
                              </p>
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
                  {(program.amenityTags?.length ?? 0) > 0 ? (
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
                  ) : program.amenities ? (
                    <p className="px-3 pb-2 text-2xs leading-relaxed text-muted-foreground">{program.amenities}</p>
                  ) : null}
                  {(program.lastEditedAt || program.lastEditedByName) ? (
                    <p className="px-3 pb-2 text-[9px] text-muted-foreground">
                      Last edited {program.lastEditedByName ? `by ${program.lastEditedByName}` : ""}
                      {program.lastEditedAt ? ` · ${formatIsoDateStable(program.lastEditedAt)}` : ""}
                    </p>
                  ) : null}
                  {showFooter ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.04] bg-white/[0.015] px-3 py-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {showLockedCommissionHint ? (
                          <>
                            <span className="text-[9px] text-muted-foreground">Partner program active</span>
                            <span
                              className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground/80"
                              title="Contact your admin for commission information."
                            >
                              <Lock className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                              Commission details
                            </span>
                          </>
                        ) : null}
                      </div>
                      {program.expiryDate != null && program.expiryDate !== "" ? (
                        <span
                          className={cn(
                            "text-[9px]",
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

        {canViewCommissions ? (
          totalVisibleAdvisories === 0 ? (
            <div className="mt-4 rounded-xl border border-white/[0.03] bg-white/[0.015] py-6 text-center">
              <p className="mb-1 text-[10px] font-medium text-foreground">Commission incentives</p>
              <p className="text-2xs text-muted-foreground">No advisory incentives on this product yet.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-[10px] font-medium text-foreground">
                Commission incentives{" "}
                <span className="font-normal text-muted-foreground">({advisoryGroups.active.length} active)</span>
              </p>
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
                              "rounded-xl border border-white/[0.05] bg-foreground/[0.03] p-3",
                              kind === "active" && "border-l-2 border-l-border",
                              kind === "upcoming" && "border-l-2 border-l-muted-foreground/40 border-dashed opacity-80",
                              kind === "expired" && "opacity-50"
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-medium text-foreground">{advisory.title}</p>
                              <span className="text-[10px] text-muted-foreground">
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
                            <p className="mt-2 text-2xs text-muted-foreground">
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
                                className="mt-2 rounded-md border border-border bg-muted/20 px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted/35"
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
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRepFirmSuggestOpen(true)}
              className="h-8 shrink-0 rounded-lg border border-[rgba(176,122,91,0.35)] bg-[rgba(176,122,91,0.08)] text-xs text-[#B07A5B] hover:bg-[rgba(176,122,91,0.14)]"
            >
              Suggest update
            </Button>
          )}
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
              const linkEmails =
                link.contactEmails && link.contactEmails.filter((x) => x.trim()).length > 0
                  ? link.contactEmails.map((x) => x.trim()).filter(Boolean)
                  : link.contactEmail?.trim()
                    ? [link.contactEmail.trim()]
                    : [];
              const linkPhones =
                link.contactPhones && link.contactPhones.filter((x) => x.trim()).length > 0
                  ? link.contactPhones.map((x) => x.trim()).filter(Boolean)
                  : link.contactPhone?.trim()
                    ? [link.contactPhone.trim()]
                    : [];
              const hasPerProductContact =
                !!(link.contactName?.trim() || linkEmails.length > 0 || linkPhones.length > 0);
              const regionsLabel = (() => {
                const rc = firmRow?.regionsCovered?.length
                  ? firmRow.regionsCovered
                  : firmRow?.regions;
                return rc?.length ? rc.join(", ") : "—";
              })();
              return (
                <div
                  key={link.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-white/[0.05] bg-foreground/[0.03]",
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
                      {firmRow?.luxPagesId ? (
                        <span className="shrink-0 rounded border border-border bg-card px-1.5 py-0.5 text-[8px] text-muted-foreground">
                          LuxPages
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {firmRow?.luxPagesLastVerified ? (
                    <p className="px-3 pb-1 text-[9px] text-[#6B6560]">
                      Verified by LuxPages:{" "}
                      {new Date(firmRow.luxPagesLastVerified).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                  {firmRow?.websiteUrl || firmRow?.portalUrl ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 pb-1.5">
                      {firmRow.websiteUrl ? (
                        <a
                          href={firmRow.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] leading-none text-[#B07A5B]/80 hover:text-[#B07A5B]"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                          Website
                        </a>
                      ) : null}
                      {firmRow.portalUrl ? (
                        <a
                          href={firmRow.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] leading-none text-[#B07A5B]/80 hover:text-[#B07A5B]"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                          Advisor portal
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  {firmRow && firmRow.contacts.length > 0 ? (
                    <div className="min-w-0 max-w-full px-3 pb-2">
                      <RepFirmContactsLuxReadonlyTable
                        contacts={firmRow.contacts}
                        firmName={firmRow.name}
                        attribution={link.repFirmName}
                        className="[&_th]:text-[#6B6560] [&_td]:text-[#F5F0EB]"
                      />
                    </div>
                  ) : null}
                  {hasPerProductContact ? (
                    <div className="space-y-1 px-3 pb-2 text-[10px] text-[#9B9590]">
                      {firmRow && firmRow.contacts.length > 0 ? (
                        <span className="block text-[9px] uppercase tracking-wider text-[#6B6560]">
                          Contact for this property
                        </span>
                      ) : null}
                      <p>
                        <span className="text-[#9B9590]">
                          {firmRow && firmRow.contacts.length > 0 ? "" : "Contact: "}
                          {link.contactName?.trim() || "—"}
                        </span>
                      </p>
                      {linkEmails.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {linkEmails.map((em, i) => (
                            <a
                              key={`${link.id}-em-${i}`}
                              href={`mailto:${em}`}
                              className="break-all text-[#B07A5B]/70 hover:text-[#B07A5B]"
                            >
                              {em}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {linkPhones.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {linkPhones.map((ph, i) => (
                            <span key={`${link.id}-ph-${i}`} className="break-all text-[#9B9590]">
                              {ph}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {link.market ? (
                    <p className="px-3 pb-2 text-[9px] text-[#9B9590]">
                      Market: <span className="text-[#F5F0EB]/90">{link.market}</span>
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
              {personalContacts.map((c) => {
                const contactEmails = emailsForContact(c);
                const contactPhones = phonesForContact(c);
                return (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.05] bg-foreground/[0.03] px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{c.name}</span>
                      <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[8px] text-muted-foreground">{c.role}</span>
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {contactEmails.length > 0 ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {contactEmails.map((email, i) => (
                            <a
                              key={`${c.id}-e-${i}`}
                              href={`mailto:${email}`}
                              className="break-all text-[9px] text-brand-cta/60 transition-colors hover:text-brand-cta"
                            >
                              {email}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {contactPhones.length > 0 ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {contactPhones.map((phone, i) => (
                            <span key={`${c.id}-p-${i}`} className="break-all text-[9px] text-muted-foreground">
                              {phone}
                            </span>
                          ))}
                        </div>
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
                );
              })}
            </div>
          )}
          {personalContactFormOpen && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-foreground/[0.03] p-2.5">
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
              <ContactChannelFormFields
                emailRows={pcEmails}
                phoneRows={pcPhones}
                onEmailChange={(index, value) =>
                  setPcEmails((prev) => prev.map((row, j) => (j === index ? value : row)))
                }
                onPhoneChange={(index, value) =>
                  setPcPhones((prev) => prev.map((row, j) => (j === index ? value : row)))
                }
                onAddEmail={() => setPcEmails((prev) => [...prev, ""])}
                onAddPhone={() => setPcPhones((prev) => [...prev, ""])}
                onRemoveEmail={(index) =>
                  setPcEmails((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== index)))
                }
                onRemovePhone={(index) =>
                  setPcPhones((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== index)))
                }
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
                    const emptyPc = defaultChannelFormRows();
                    setPcEmails(emptyPc.emails);
                    setPcPhones(emptyPc.phones);
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <UserPlus className="h-3.5 w-3.5 text-[rgba(140,160,180,0.5)]" aria-hidden />
              <span className="text-[11px] font-medium text-foreground">Agency contacts</span>
              <TeamScopedFieldNotice show={!isAdmin} />
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
                const contactEmails = emailsForContact(c);
                const contactPhones = phonesForContact(c);
                return (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.04] bg-foreground/[0.03] px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{c.name}</span>
                        <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[8px] text-muted-foreground">{c.role}</span>
                      </div>
                      <div className="mt-0.5 space-y-0.5">
                        {contactEmails.length > 0 ? (
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            {contactEmails.map((email, i) => (
                              <a
                                key={`${c.id}-e-${i}`}
                                href={`mailto:${email}`}
                                className="break-all text-[9px] text-brand-cta/60 transition-colors hover:text-brand-cta"
                              >
                                {email}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        {contactPhones.length > 0 ? (
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            {contactPhones.map((phone, i) => (
                              <span key={`${c.id}-p-${i}`} className="break-all text-[9px] text-muted-foreground">
                                {phone}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      {c.note ? <p className="mt-0.5 text-[9px] italic text-muted-foreground">{c.note}</p> : null}
                      {c.addedBy ? (
                        <span className="mt-0.5 block text-[8px] text-muted-foreground/65">
                          Added by {c.addedBy}
                          {c.addedAt ? ` · ${formatIsoDateStable(c.addedAt)}` : ""}
                        </span>
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
            <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-foreground/[0.03] p-2.5">
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
              <ContactChannelFormFields
                emailRows={newAgencyContactEmails}
                phoneRows={newAgencyContactPhones}
                onEmailChange={(index, value) =>
                  setNewAgencyContactEmails((prev) => prev.map((row, j) => (j === index ? value : row)))
                }
                onPhoneChange={(index, value) =>
                  setNewAgencyContactPhones((prev) => prev.map((row, j) => (j === index ? value : row)))
                }
                onAddEmail={() => setNewAgencyContactEmails((prev) => [...prev, ""])}
                onAddPhone={() => setNewAgencyContactPhones((prev) => [...prev, ""])}
                onRemoveEmail={(index) =>
                  setNewAgencyContactEmails((prev) =>
                    prev.length <= 1 ? prev : prev.filter((_, j) => j !== index),
                  )
                }
                onRemovePhone={(index) =>
                  setNewAgencyContactPhones((prev) =>
                    prev.length <= 1 ? prev : prev.filter((_, j) => j !== index),
                  )
                }
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
                    const emptyAg = defaultChannelFormRows();
                    setNewAgencyContactEmails(emptyAg.emails);
                    setNewAgencyContactPhones(emptyAg.phones);
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
                  className="rounded-lg border border-white/[0.05] bg-foreground/[0.03] p-2.5"
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
          <p className="mb-2 text-2xs leading-relaxed text-muted-foreground/70">
            Agency notes are visible to your team.
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Users className="h-3 w-3 shrink-0" style={{ color: "rgba(140,160,180,0.50)" }} aria-hidden />
            <span className="text-[11px] font-medium text-foreground">Agency notes</span>
            <TeamScopedFieldNotice show={!isAdmin} />
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
                        <span className="text-2xs font-medium text-muted-foreground">{note.authorName}</span>
                        <span className="text-2xs text-muted-foreground/65">·</span>
                        <span className="text-2xs text-muted-foreground/65" title={formatIsoDateStable(note.createdAt)}>
                          {relativeTime(note.createdAt)} ({formatIsoDateStable(note.createdAt)})
                        </span>
                        {note.pinned ? (
                          <span className="ml-auto text-[9px] text-amber-500/60">Pinned</span>
                        ) : null}
                      </div>
                      {canEditAgencyNote(note) && !note.pendingUpgrade ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {isAdmin ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="h-6 text-[9px] text-muted-foreground/65 hover:text-brand-cta"
                              onClick={() => toggleAgencyNotePin(note.id)}
                            >
                              <Pin className="size-3" aria-hidden />
                              {note.pinned ? "Unpin" : "Pin"}
                            </Button>
                          ) : null}
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
              Post
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
                : "border-border bg-white/[0.03] hover:bg-foreground/[0.06]"
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
            <div className="mb-3 rounded-lg border border-border bg-foreground/[0.04] p-2.5">
              <p className="line-clamp-3 text-xs italic text-muted-foreground">&quot;{upgradeConfirmText}&quot;</p>
            </div>
            <p className="mb-4 text-2xs leading-relaxed text-muted-foreground">
              Needs admin approval. Your private note is unchanged.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setUpgradeConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="cta" size="sm" className="h-8 text-xs text-primary-foreground" onClick={confirmUpgrade}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={repFirmSuggestOpen} onOpenChange={setRepFirmSuggestOpen}>
        <DialogContent className="border-border bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest a change to rep firm details</DialogTitle>
          </DialogHeader>
          <textarea
            className="min-h-[100px] w-full resize-none rounded-lg border border-border bg-inset px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Describe the update you would like an admin to review…"
            value={repFirmSuggestText}
            onChange={(e) => setRepFirmSuggestText(e.target.value)}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRepFirmSuggestOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="border-[rgba(176,122,91,0.30)] bg-[rgba(176,122,91,0.10)] text-[#B07A5B] hover:bg-[rgba(176,122,91,0.15)]"
              onClick={() => {
                if (!repFirmSuggestText.trim()) return;
                toast({
                  title: "Suggestion recorded (demo)",
                  description: "Changes are not applied until an admin reviews them.",
                  tone: "success",
                });
                setRepFirmSuggestOpen(false);
                setRepFirmSuggestText("");
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {contactUpgradeOpen && contactUpgradeTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-border bg-popover p-5 shadow-2xl">
            <h3 className="mb-2 text-sm font-medium text-foreground">Share contact with agency?</h3>
            <div className="mb-3 rounded-lg border border-white/[0.04] bg-white/[0.03] p-2.5">
              <p className="text-xs font-medium text-foreground">{contactUpgradeTarget.name}</p>
              <p className="text-2xs text-muted-foreground">{contactUpgradeTarget.role}</p>
              <div className="mt-1.5 space-y-1">
                <div>
                  <p className="text-[9px] font-medium text-muted-foreground">Email addresses</p>
                  {contactUpgradeTarget.emails.filter((e) => e.trim()).length > 0 ? (
                    <ul className="mt-0.5 list-inside list-disc space-y-0.5">
                      {contactUpgradeTarget.emails
                        .map((e) => e.trim())
                        .filter(Boolean)
                        .map((email, i) => (
                          <li key={`e-${i}-${email}`} className="break-all text-2xs text-muted-foreground">
                            {email}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="mt-0.5 text-2xs text-muted-foreground">—</p>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-medium text-muted-foreground">Phone numbers</p>
                  {contactUpgradeTarget.phones.filter((p) => p.trim()).length > 0 ? (
                    <ul className="mt-0.5 list-inside list-disc space-y-0.5">
                      {contactUpgradeTarget.phones
                        .map((p) => p.trim())
                        .filter(Boolean)
                        .map((phone, i) => (
                          <li key={`p-${i}-${phone}`} className="break-all text-2xs text-muted-foreground">
                            {phone}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="mt-0.5 text-2xs text-muted-foreground">—</p>
                  )}
                </div>
              </div>
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
              <Button type="button" variant="cta" size="sm" className="h-8 text-xs text-primary-foreground" onClick={confirmContactUpgrade}>
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
