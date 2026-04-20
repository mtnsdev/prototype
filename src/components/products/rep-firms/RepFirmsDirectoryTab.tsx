"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Facebook,
  Flame,
  Instagram,
  Link2,
  Linkedin,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import {
  directoryProductTypeShortLabel,
  getPrimaryDirectoryType,
} from "@/components/products/directoryProductTypeHelpers";
import { directoryCategoryColors } from "@/components/products/productDirectoryVisual";
import type { Team } from "@/types/teams";
import type { RepFirm, RepFirmContactRow, RepFirmProductLink, RepFirmSpecialty } from "@/types/rep-firm";
import { DirectoryEditorSectionNav } from "@/components/products/DirectoryEditorSectionNav";
import { REP_FIRM_EDITOR_SECTION_IDS } from "@/lib/repFirmEditorSections";
import { cn } from "@/lib/utils";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import {
  getActiveIncentiveOfferCount,
  isProgramBookable,
  programDisplayCommissionRate,
  programDisplayName,
} from "@/components/products/productDirectoryCommission";
import { PageSearchField } from "@/components/ui/page-search-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditIconButton } from "@/components/ui/edit-icon-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";
import { productMatchesPartnerAttachSearch } from "@/components/products/productDirectoryLogic";
import { REP_FIRM_SPECIALTIES, REP_FIRM_SPECIALTY_LABELS } from "@/lib/repFirmConstants";
import {
  defaultRepFirmChannelFormRows,
  emailsForRepFirmContact,
  persistedRepFirmContactRow,
  phonesForRepFirmContact,
} from "@/lib/repFirmContactChannels";
import { RepFirmContactsLuxReadonlyTable } from "@/components/products/rep-firms/RepFirmContactsLuxTable";
import { normalizeRepFirmUrl } from "@/lib/repFirmMigrate";
import {
  listTableClass,
  listTdClass,
  listThClass,
  listTheadRowClass,
  listTbodyRowClass,
} from "@/lib/list-ui";

const REP_FIRM_INPUT_CLASS =
  "h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]";

const REP_FIRM_TEXTAREA_CLASS =
  "w-full resize-none rounded-lg border border-white/[0.14] bg-inset px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]";

/** Table cell inputs — line-based Lux style (no avatars). */
const REP_FIRM_CONTACT_EDIT_INPUT =
  "h-8 w-full min-w-0 rounded-md border border-border bg-inset px-2 text-xs text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]";

type RepFirmSingleSelectDropdownProps = {
  placeholder: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  maxWidthClassName?: string;
  ariaLabel: string;
  searchPlaceholder: string;
  formatOption?: (option: string) => string;
};

function defaultFormatOption(option: string): string {
  if (option === "active") return "Active";
  if (option === "inactive") return "Inactive";
  if (option === "prospect") return "Prospect";
  if (REP_FIRM_SPECIALTY_LABELS[option as RepFirmSpecialty]) {
    return REP_FIRM_SPECIALTY_LABELS[option as RepFirmSpecialty];
  }
  return option;
}

function RepFirmSingleSelectDropdown({
  placeholder,
  value,
  options,
  onChange,
  maxWidthClassName = "max-w-[200px]",
  ariaLabel,
  searchPlaceholder,
  formatOption = defaultFormatOption,
}: RepFirmSingleSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const q = search.trim().toLowerCase();
  const showAllRow = q === "" || "all".startsWith(q) || "any".startsWith(q);
  const filteredOptions = options.filter(
    (o) => o.toLowerCase().includes(q) || formatOption(o).toLowerCase().includes(q)
  );

  const selectedLabel = value === "all" ? null : formatOption(value);

  const summary =
    selectedLabel == null ? (
      <span className="text-xs text-muted-foreground">{placeholder}</span>
    ) : (
      <span className="truncate text-xs text-foreground">{selectedLabel}</span>
    );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
          maxWidthClassName,
          selectedLabel
            ? "border-[rgba(176,122,91,0.25)] bg-[rgba(176,122,91,0.10)] text-[#B07A5B]"
            : "border-border bg-popover text-muted-foreground hover:border-border"
        )}
      >
        {summary}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-56 rounded-xl border border-border bg-popover shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-border bg-popover p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border-none bg-foreground/[0.04] px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/35"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {showAllRow ? (
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-white/[0.04]"
                onClick={() => {
                  onChange("all");
                  setOpen(false);
                }}
              >
                <span>All</span>
                {value === "all" ? (
                  <Check className="h-3 w-3 shrink-0 text-[#B07A5B]" />
                ) : (
                  <span className="h-3 w-3 shrink-0" />
                )}
              </button>
            ) : null}
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-white/[0.04]"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <span className="truncate pr-2">{formatOption(option)}</span>
                {value === option ? (
                  <Check className="h-3 w-3 shrink-0 text-[#B07A5B]" />
                ) : (
                  <span className="h-3 w-3 shrink-0" />
                )}
              </button>
            ))}
            {!showAllRow && filteredOptions.length === 0 ? (
              <p className="px-3 py-4 text-center text-2xs text-muted-foreground">No matches</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function RepFirmSpecialtyMultiSelect({
  value,
  onChange,
  disabled,
}: {
  value: RepFirmSpecialty[];
  onChange: (next: RepFirmSpecialty[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const opts = REP_FIRM_SPECIALTIES.filter(
    (o) => o.toLowerCase().includes(q) || defaultFormatOption(o).toLowerCase().includes(q)
  );
  const summary =
    value.length === 0 ? (
      <span className="text-xs text-muted-foreground">Select specialties…</span>
    ) : (
      <span className="line-clamp-2 text-xs text-foreground">
        {value.map((s) => REP_FIRM_SPECIALTY_LABELS[s]).join(", ")}
      </span>
    );
  const toggle = (opt: RepFirmSpecialty) => {
    if (value.includes(opt)) onChange(value.filter((s) => s !== opt));
    else onChange([...value, opt]);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex min-h-9 w-full max-w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
            disabled ? "opacity-50" : "",
            value.length > 0
              ? "border-[rgba(176,122,91,0.25)] bg-[rgba(176,122,91,0.10)] text-[#B07A5B]"
              : "border-border bg-popover text-muted-foreground hover:border-border"
          )}
        >
          {summary}
          <ChevronDown className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b border-border p-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search specialties…"
            className="w-full rounded-md border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {opts.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white/[0.04]"
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={value.includes(opt)}
                onChange={() => toggle(opt)}
                className="checkbox-on-dark"
              />
              {REP_FIRM_SPECIALTY_LABELS[opt]}
            </label>
          ))}
          {opts.length === 0 ? (
            <p className="px-2 py-4 text-center text-2xs text-muted-foreground">No matches</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Catalog-aligned section label for the rep firm editor (no step badges — matches list-card rhythm). */
function RepFirmEditorSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
      {children}
    </h3>
  );
}

const repFirmCatalogLinkIconClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function repFirmCatalogDescriptionText(row: RepFirm): string | null {
  const d = row.description?.trim();
  if (d) return d;
  const t = row.tagline?.trim();
  return t || null;
}

function RepFirmCatalogLuxProvenance({ row }: { row: RepFirm }) {
  if (!row.luxPagesId) return null;
  const verifiedDate = row.luxPagesLastVerified
    ? new Date(row.luxPagesLastVerified).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  return (
    <div className="mt-1">
      <p className="text-[9px] leading-tight text-muted-foreground/70">
        {verifiedDate ? (
          <>
            Verified by LuxPages: <span className="tabular-nums text-muted-foreground/85">{verifiedDate}</span>
          </>
        ) : (
          <span>LuxPages profile linked</span>
        )}
      </p>
    </div>
  );
}

function RepFirmCatalogWebSocialIcons({ row }: { row: RepFirm }) {
  const webHref = normalizeRepFirmUrl(row.websiteUrl ?? row.website);
  const sm = row.socialMedia;
  const fbHref = sm?.facebook?.trim() ? normalizeRepFirmUrl(sm.facebook) : null;
  const igHref = sm?.instagram?.trim() ? normalizeRepFirmUrl(sm.instagram) : null;
  const liHref = sm?.linkedin?.trim() ? normalizeRepFirmUrl(sm.linkedin) : null;
  if (!webHref && !fbHref && !igHref && !liHref) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {webHref ? (
        <a
          href={webHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website"
          className={repFirmCatalogLinkIconClass}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
      {fbHref ? (
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className={repFirmCatalogLinkIconClass}
        >
          <Facebook className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
      {igHref ? (
        <a
          href={igHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className={repFirmCatalogLinkIconClass}
        >
          <Instagram className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
      {liHref ? (
        <a
          href={liHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className={repFirmCatalogLinkIconClass}
        >
          <Linkedin className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

function RepFirmLinkedProductStripTile({
  product,
  canViewCommissions,
  onSelect,
  brokenImage,
  onImageError,
}: {
  product: DirectoryProduct;
  canViewCommissions: boolean;
  onSelect: () => void;
  brokenImage: boolean;
  onImageError: () => void;
}) {
  const placeLine =
    product.city && product.country ? `${product.city}, ${product.country}` : product.location;
  const incentiveOfferCount = getActiveIncentiveOfferCount(product);
  const showIncentive = canViewCommissions && incentiveOfferCount > 0;
  const primaryType = getPrimaryDirectoryType(product);
  const cat = directoryCategoryColors(primaryType);
  const typePillLabel = directoryProductTypeShortLabel(product);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-[104px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-border bg-inset text-left shadow-sm transition-colors hover:border-[rgba(176,122,91,0.35)]"
    >
      <div className="relative h-[64px] w-full overflow-hidden bg-popover">
        {product.imageUrl && !brokenImage ? (
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={onImageError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
        <span
          className="absolute bottom-1.5 left-1.5 rounded-full border px-1.5 py-px text-[8px] backdrop-blur-sm"
          style={{
            background: cat.bg,
            color: cat.color,
            borderColor: cat.border,
          }}
        >
          {typePillLabel}
        </span>
        {showIncentive ? (
          <div
            className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-400"
            title={`${incentiveOfferCount} active incentive${incentiveOfferCount !== 1 ? "s" : ""}`}
          >
            <Flame className="h-2 w-2" aria-hidden />
            {incentiveOfferCount > 1 ? incentiveOfferCount : null}
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 px-1.5 py-1.5 pt-1">
        <p className="line-clamp-2 text-[10px] font-medium leading-snug text-foreground">{product.name}</p>
        {placeLine ? (
          <p className="line-clamp-1 text-[8px] leading-tight text-muted-foreground">{placeLine}</p>
        ) : null}
      </div>
    </button>
  );
}

type RepFirmSuggestion = {
  id: string;
  repFirmName: string;
  note: string;
  suggestedBy: string;
  createdAt: string;
  status: "pending";
};

type ContactDraft = {
  _cid: string;
  name: string;
  title: string | null;
  emailRows: string[];
  phoneRows: string[];
  photoUrl: string | null;
};

type RepFirmFormState = {
  name: string;
  specialty: RepFirmSpecialty[];
  regionsText: string;
  phone: string;
  hqAddress: string;
  websiteUrl: string;
  portalUrl: string;
  portalCredentialsNote: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedin: string;
  contacts: ContactDraft[];
  notes: string;
  logoUrl: string;
};

type RepFirmPerProductContactDraft = {
  contactName: string;
  contactEmails: string[];
  contactPhones: string[];
  notes: string;
  market: string;
};

function emptyPerProductDraft(): RepFirmPerProductContactDraft {
  const rows = defaultRepFirmChannelFormRows();
  return {
    contactName: "",
    contactEmails: rows.emails,
    contactPhones: rows.phones,
    notes: "",
    market: "",
  };
}

/** One row in the linked-properties table when “Contact & notes per property” is on — matches firm-level contact cell styling. */
function LinkedPropertyPerProductContactRow({
  product,
  draft,
  disabled,
  onReplaceDraft,
  canViewCommissions,
  onSelectProduct,
}: {
  product: DirectoryProduct;
  draft: RepFirmPerProductContactDraft;
  disabled: boolean;
  onReplaceDraft: (next: RepFirmPerProductContactDraft) => void;
  canViewCommissions: boolean;
  onSelectProduct: (productId: string) => void;
}) {
  const place = [product.city, product.country].filter(Boolean).join(", ") || product.location || "—";
  const topProg =
    product.partnerPrograms?.find((pp) => isProgramBookable(pp)) ?? product.partnerPrograms?.[0];

  return (
    <tr className={listTbodyRowClass}>
      <td className={listTdClass}>
        <button
          type="button"
          className="text-left font-medium text-foreground hover:underline"
          onClick={() => onSelectProduct(product.id)}
        >
          {product.name}
        </button>
      </td>
      <td className={cn(listTdClass, "text-muted-foreground")}>{place}</td>
      <td className={cn(listTdClass, "text-muted-foreground")}>{directoryProductTypeShortLabel(product)}</td>
      <td className={cn(listTdClass, "text-muted-foreground")}>
        {topProg ? (
          <span>
            {programDisplayName(topProg)}
            {canViewCommissions && isProgramBookable(topProg) ? (
              <span className="ml-1 text-[10px] text-muted-foreground">
                {programDisplayCommissionRate(topProg)}%
              </span>
            ) : null}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className={cn(listTdClass, "align-top")}>
        <input
          value={draft.market}
          disabled={disabled}
          onChange={(e) => onReplaceDraft({ ...draft, market: e.target.value })}
          placeholder="Market (optional)"
          className={REP_FIRM_CONTACT_EDIT_INPUT}
          aria-label="Market"
        />
      </td>
      <td className={cn(listTdClass, "align-top")}>
        <input
          value={draft.contactName}
          disabled={disabled}
          onChange={(e) => onReplaceDraft({ ...draft, contactName: e.target.value })}
          placeholder="Contact name (optional)"
          className={REP_FIRM_CONTACT_EDIT_INPUT}
          aria-label="Contact name"
        />
      </td>
      <td className={cn(listTdClass, "min-w-[140px] align-top")}>
        <div className="flex flex-col gap-1">
          {draft.contactPhones.map((ph, i) => (
            <div key={`lp-ph-${product.id}-${i}`} className="flex gap-0.5">
              <input
                value={ph}
                disabled={disabled}
                onChange={(e) =>
                  onReplaceDraft({
                    ...draft,
                    contactPhones: draft.contactPhones.map((v, j) => (j === i ? e.target.value : v)),
                  })
                }
                placeholder="Phone number (optional)"
                type="tel"
                autoComplete="tel"
                className={cn(REP_FIRM_CONTACT_EDIT_INPUT, "tabular-nums")}
                aria-label={`Phone ${i + 1}`}
              />
              {draft.contactPhones.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                  aria-label="Remove phone number"
                  onClick={() =>
                    onReplaceDraft({
                      ...draft,
                      contactPhones:
                        draft.contactPhones.length <= 1
                          ? draft.contactPhones
                          : draft.contactPhones.filter((_, j) => j !== i),
                    })
                  }
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-7 self-start px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => onReplaceDraft({ ...draft, contactPhones: [...draft.contactPhones, ""] })}
          >
            <Plus className="mr-0.5 h-3 w-3" aria-hidden />
            Add phone number
          </Button>
        </div>
      </td>
      <td className={cn(listTdClass, "min-w-[160px] align-top")}>
        <div className="flex flex-col gap-1">
          {draft.contactEmails.map((em, i) => (
            <div key={`lp-em-${product.id}-${i}`} className="flex gap-0.5">
              <input
                value={em}
                disabled={disabled}
                onChange={(e) =>
                  onReplaceDraft({
                    ...draft,
                    contactEmails: draft.contactEmails.map((v, j) => (j === i ? e.target.value : v)),
                  })
                }
                placeholder="Email address (optional)"
                type="email"
                inputMode="email"
                autoComplete="email"
                className={REP_FIRM_CONTACT_EDIT_INPUT}
                aria-label={`Email ${i + 1}`}
              />
              {draft.contactEmails.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                  aria-label="Remove email address"
                  onClick={() =>
                    onReplaceDraft({
                      ...draft,
                      contactEmails:
                        draft.contactEmails.length <= 1
                          ? draft.contactEmails
                          : draft.contactEmails.filter((_, j) => j !== i),
                    })
                  }
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-7 self-start px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => onReplaceDraft({ ...draft, contactEmails: [...draft.contactEmails, ""] })}
          >
            <Plus className="mr-0.5 h-3 w-3" aria-hidden />
            Add email address
          </Button>
        </div>
      </td>
      <td className={cn(listTdClass, "max-w-[220px] align-top")}>
        <textarea
          value={draft.notes}
          disabled={disabled}
          rows={2}
          onChange={(e) => onReplaceDraft({ ...draft, notes: e.target.value })}
          placeholder="Notes (optional)"
          className={cn(
            REP_FIRM_CONTACT_EDIT_INPUT,
            "min-h-[2.75rem] resize-y py-1.5 leading-snug placeholder:text-muted-foreground/65"
          )}
          aria-label="Notes for this property"
        />
      </td>
    </tr>
  );
}

function contactDraftFromRepFirmRow(c: RepFirmContactRow, _cid: string): ContactDraft {
  const em = emailsForRepFirmContact(c);
  const ph = phonesForRepFirmContact(c);
  const empty = defaultRepFirmChannelFormRows();
  return {
    _cid,
    name: c.name,
    title: c.title,
    emailRows: em.length ? em : [...empty.emails],
    phoneRows: ph.length ? ph : [...empty.phones],
    photoUrl: c.photoUrl,
  };
}

function contactDraftToDisplayRow(d: ContactDraft): RepFirmContactRow {
  return {
    name: d.name,
    title: d.title,
    photoUrl: d.photoUrl,
    ...persistedRepFirmContactRow(d.emailRows, d.phoneRows),
  };
}

function newContactDraft(partial?: Partial<RepFirmContactRow>): ContactDraft {
  const empty = defaultRepFirmChannelFormRows();
  const em = partial ? emailsForRepFirmContact(partial as RepFirmContactRow) : [];
  const ph = partial ? phonesForRepFirmContact(partial as RepFirmContactRow) : [];
  return {
    _cid: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: partial?.name ?? "",
    title: partial?.title ?? null,
    emailRows: em.length ? em : [...empty.emails],
    phoneRows: ph.length ? ph : [...empty.phones],
    photoUrl: partial?.photoUrl ?? null,
  };
}

function repFirmFormFromRow(row: RepFirm): RepFirmFormState {
  const hq = row.headquarters;
  const sm = row.socialMedia;
  return {
    name: row.name,
    specialty: [...row.specialty],
    regionsText: row.regionsCovered.join(", "),
    phone: row.phone ?? "",
    hqAddress: hq?.address ?? "",
    websiteUrl: row.websiteUrl ?? "",
    portalUrl: row.portalUrl ?? "",
    portalCredentialsNote: row.portalCredentialsNote ?? "",
    socialFacebook: sm?.facebook ?? "",
    socialInstagram: sm?.instagram ?? "",
    socialLinkedin: sm?.linkedin ?? "",
    contacts:
      row.contacts.length > 0
        ? row.contacts.map((c, i) => contactDraftFromRepFirmRow(c, `c-${row.id}-${i}`))
        : [newContactDraft()],
    notes: row.notes ?? "",
    logoUrl: row.logoUrl ?? "",
  };
}

/** Persisted stub — same shape as created on first save in the former “add” flow. */
function newStubRepFirm(editorDisplayName: string): RepFirm {
  const now = new Date().toISOString();
  return {
    id: `rf-${Date.now()}`,
    name: "New rep firm",
    representativeNames: [],
    specialty: ["hotels"],
    regionsCovered: [],
    phone: null,
    headquarters: null,
    websiteUrl: null,
    portalUrl: null,
    portalCredentialsNote: null,
    socialMedia: null,
    contacts: [],
    relationshipOwner: null,
    notes: null,
    status: "active",
    propertyCount: 0,
    scope: TEAM_EVERYONE_ID,
    createdAt: now,
    updatedAt: now,
    lastEditedAt: now,
    lastEditedByName: editorDisplayName,
  };
}

function repFirmEditSnapshot(
  form: RepFirmFormState,
  attachDraftIds: string[],
  usePerProductContacts: boolean,
  perProductContacts: Record<string, RepFirmPerProductContactDraft>
): string {
  const sortedAttach = [...attachDraftIds].sort();
  const sortedPerKeys = Object.keys(perProductContacts).sort();
  const perSorted: Record<string, RepFirmPerProductContactDraft> = {};
  sortedPerKeys.forEach((k) => {
    perSorted[k] = perProductContacts[k];
  });
  return JSON.stringify({
    form,
    attach: sortedAttach,
    usePer: usePerProductContacts,
    per: perSorted,
  });
}

type LinkedRow = { product: DirectoryProduct; link: RepFirmProductLink };

type RepFirmsTabProps = {
  repFirms: RepFirm[];
  products: DirectoryProduct[];
  teams: Team[];
  isAdmin: boolean;
  editorDisplayName: string;
  canViewCommissions: boolean;
  externalSearchCollectionId: string;
  getExternalSearchTooltip: (productId: string) => string | undefined;
  onSaveRepFirm: (id: string, patch: Partial<RepFirm>) => void;
  onAddRepFirm: (row: RepFirm) => void;
  onRemoveRepFirm: (id: string) => void;
  onSelectProduct: (productId: string) => void;
  onOpenCollectionPicker: (productId: string) => void;
  onBrowseByRepFirm: (repFirmId: string) => void;
  /** Parent catalog column disables outer scroll while add/edit is open (single scroll in editor body). */
  onEditorSurfaceChange?: (editorOpen: boolean) => void;
  /** False when Rep Firms tab is hidden in the catalog shell. */
  repTabVisible?: boolean;
  onSyncRepFirmProductLinks: (args: {
    repFirmId: string;
    attachedProductIds: string[];
    firmName: string;
    firmScope: string;
    firmStatus: "active" | "inactive" | "prospect";
    usePerProductContacts: boolean;
    perProductContacts: Record<
      string,
      {
        contactName: string;
        contactEmails: string[];
        contactPhones: string[];
        notes: string;
        market: string;
      }
    >;
    firmContact: { contactName?: string; contactEmail?: string; contactPhone?: string };
  }) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

function repFirmCatalogDomId(id: string): string {
  return `rep-firm-catalog-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

type SortKey = "name" | "location" | "type" | "program" | "notes" | "market";

export function ProductDirectoryRepFirmsTab({
  repFirms,
  products,
  teams,
  isAdmin,
  editorDisplayName,
  canViewCommissions,
  externalSearchCollectionId,
  getExternalSearchTooltip,
  onSaveRepFirm,
  onAddRepFirm,
  onRemoveRepFirm,
  onSelectProduct,
  onOpenCollectionPicker,
  onBrowseByRepFirm,
  onSyncRepFirmProductLinks,
  onEditorSurfaceChange,
  repTabVisible = true,
  onDirtyChange,
}: RepFirmsTabProps) {
  void teams;
  void externalSearchCollectionId;
  void getExternalSearchTooltip;
  void onOpenCollectionPicker;

  const toast = useToast();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFirmId, setEditingFirmId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<RepFirmFormState | null>(null);
  const [editBaseline, setEditBaseline] = useState("");
  const [attachDraftIds, setAttachDraftIds] = useState<string[]>([]);
  const [attachSearchQuery, setAttachSearchQuery] = useState("");
  const [usePerProductContacts, setUsePerProductContacts] = useState(false);
  const [perProductContacts, setPerProductContacts] = useState<Record<string, RepFirmPerProductContactDraft>>({});
  const [tableSort, setTableSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  const [discardDialog, setDiscardDialog] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [suggestedFirmName, setSuggestedFirmName] = useState("");
  const [suggestionNote, setSuggestionNote] = useState("");
  const [suggestions, setSuggestions] = useState<RepFirmSuggestion[]>([]);
  const [linkedProductBrokenImages, setLinkedProductBrokenImages] = useState<Record<string, boolean>>({});

  const repFirmDirtyRef = useRef(false);
  const repFirmEditorScrollRef = useRef<HTMLDivElement>(null);
  const openedUrlRef = useRef<string | null>(null);

  const availableRegions = useMemo(
    () => Array.from(new Set(repFirms.flatMap((row) => row.regionsCovered))).sort((a, b) => a.localeCompare(b)),
    [repFirms]
  );

  const repFirmSearchBlob = useCallback((row: RepFirm) => {
    return [
      row.name,
      row.regionsCovered.join(" "),
      row.specialty.map((s) => REP_FIRM_SPECIALTY_LABELS[s]).join(" "),
      row.phone ?? "",
      row.notes ?? "",
      row.contacts.map((c) => [c.name, c.title, c.email, c.phone].filter(Boolean).join(" ")).join(" "),
    ]
      .join(" ")
      .toLowerCase();
  }, []);

  const filteredRepFirms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repFirms.filter((row) => {
      if (regionFilter !== "all" && !row.regionsCovered.includes(regionFilter)) return false;
      if (specialtyFilter !== "all" && !row.specialty.includes(specialtyFilter as RepFirmSpecialty)) {
        return false;
      }
      if (!q) return true;
      return repFirmSearchBlob(row).includes(q);
    });
  }, [
    repFirms,
    query,
    regionFilter,
    specialtyFilter,
    repFirmSearchBlob,
  ]);

  const linkedProductMap = useMemo(() => {
    const map = new Map<string, LinkedRow[]>();
    repFirms.forEach((row) => map.set(row.id, []));
    products.forEach((p) => {
      (p.repFirmLinks ?? []).forEach((link) => {
        const existing = map.get(link.repFirmId) ?? [];
        if (!existing.some((x) => x.product.id === p.id)) {
          existing.push({ product: p, link });
        }
        map.set(link.repFirmId, existing);
      });
    });
    return map;
  }, [repFirms, products]);

  const catalogProductsForRepFirmAttach = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const parseRepFirmPatch = (form: RepFirmFormState, linkedProductCount: number): Partial<RepFirm> => {
    const now = new Date().toISOString();
    const contacts: RepFirmContactRow[] = form.contacts
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        title: c.title?.trim() ? c.title.trim() : null,
        photoUrl: c.photoUrl?.trim() ? c.photoUrl.trim() : null,
        ...persistedRepFirmContactRow(c.emailRows, c.phoneRows),
      }));
    const hq = form.hqAddress.trim()
      ? {
          city: null,
          country: null,
          address: form.hqAddress.trim(),
        }
      : null;
    const sm =
      form.socialFacebook.trim() || form.socialInstagram.trim() || form.socialLinkedin.trim()
        ? {
            facebook: form.socialFacebook.trim() ? form.socialFacebook.trim() : null,
            instagram: form.socialInstagram.trim() ? form.socialInstagram.trim() : null,
            linkedin: form.socialLinkedin.trim() ? form.socialLinkedin.trim() : null,
          }
        : null;
    return {
      name: form.name.trim(),
      representativeNames: [],
      specialty: form.specialty.length > 0 ? [...form.specialty] : ["hotels"],
      regionsCovered: form.regionsText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      phone: form.phone.trim() ? form.phone.trim() : null,
      headquarters: hq,
      websiteUrl: form.websiteUrl.trim() ? form.websiteUrl.trim() : null,
      portalUrl: form.portalUrl.trim() ? form.portalUrl.trim() : null,
      portalCredentialsNote: form.portalCredentialsNote.trim() ? form.portalCredentialsNote.trim() : null,
      socialMedia: sm,
      contacts,
      notes: form.notes.trim() ? form.notes.trim() : null,
      propertyCount: linkedProductCount,
      logoUrl: form.logoUrl.trim() || undefined,
      updatedAt: now,
      lastEditedAt: now,
      lastEditedByName: editorDisplayName,
    };
  };

  const isRepFirmEditDirty = useCallback(() => {
    if (!editForm) return false;
    const cur = repFirmEditSnapshot(editForm, attachDraftIds, usePerProductContacts, perProductContacts);
    return editBaseline !== "" && cur !== editBaseline;
  }, [editForm, attachDraftIds, usePerProductContacts, perProductContacts, editBaseline]);

  const clearDialogSession = useCallback(() => {
    setDialogOpen(false);
    setEditingFirmId(null);
    setEditForm(null);
    setEditBaseline("");
    setAttachDraftIds([]);
    setAttachSearchQuery("");
    setUsePerProductContacts(false);
    setPerProductContacts({});
    setTableSort({ key: "name", dir: "asc" });
  }, []);

  const requestCloseDialog = useCallback(
    (dirty: boolean) => {
      if (!dirty) {
        clearDialogSession();
        return;
      }
      setDiscardDialog({
        title: "Discard changes?",
        description: "Your edits will be lost.",
        confirmLabel: "Discard changes",
        onConfirm: () => {
          clearDialogSession();
          setDiscardDialog(null);
        },
      });
    },
    [clearDialogSession]
  );

  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (discardDialog) return;
      requestCloseDialog(isRepFirmEditDirty());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen, discardDialog, requestCloseDialog, isRepFirmEditDirty]);

  useEffect(() => {
    if (!dialogOpen || discardDialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s")) return;
      e.preventDefault();
      if (!editForm?.name.trim()) {
        toast({ title: "Firm name is required", tone: "destructive" });
        return;
      }
      const btn = document.getElementById("rep-firm-editor-save") as HTMLButtonElement | null;
      if (btn && !btn.disabled) btn.click();
      else toast({ title: "No changes to save", tone: "destructive" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen, discardDialog, editForm?.name, toast]);

  const beginEditFirm = useCallback(
    (row: RepFirm) => {
      if (!isAdmin) return;
      const linked = linkedProductMap.get(row.id) ?? [];
      const attachIds = linked.map((x) => x.product.id);
      const per: Record<string, RepFirmPerProductContactDraft> = {};
      const emptyCh = defaultRepFirmChannelFormRows();
      linked.forEach((item) => {
        const l = item.link;
        const em =
          l.contactEmails && l.contactEmails.length > 0
            ? l.contactEmails.map((x) => x.trim()).filter(Boolean)
            : l.contactEmail?.trim()
              ? [l.contactEmail.trim()]
              : [""];
        const ph =
          l.contactPhones && l.contactPhones.length > 0
            ? l.contactPhones.map((x) => x.trim()).filter(Boolean)
            : l.contactPhone?.trim()
              ? [l.contactPhone.trim()]
              : [""];
        per[item.product.id] = {
          contactName: l.contactName ?? "",
          contactEmails: em.length ? em : [...emptyCh.emails],
          contactPhones: ph.length ? ph : [...emptyCh.phones],
          notes: l.notes ?? "",
          market: l.market ?? "",
        };
      });
      const hasPerProductData = linked.some(({ link: l }) => {
        const hasEm =
          (l.contactEmails?.filter((x) => x.trim()).length ?? 0) > 0 || !!l.contactEmail?.trim();
        const hasPh =
          (l.contactPhones?.filter((x) => x.trim()).length ?? 0) > 0 || !!l.contactPhone?.trim();
        return !!(
          l.contactName?.trim() ||
          hasEm ||
          hasPh ||
          l.notes?.trim() ||
          l.market?.trim()
        );
      });
      const form = repFirmFormFromRow(row);
      setEditingFirmId(row.id);
      setEditForm(form);
      setAttachDraftIds(attachIds);
      setAttachSearchQuery("");
      setUsePerProductContacts(hasPerProductData);
      setPerProductContacts(per);
      setEditBaseline(repFirmEditSnapshot(form, attachIds, hasPerProductData, per));
      setDialogOpen(true);
    },
    [isAdmin, linkedProductMap]
  );

  const beginAddFirm = useCallback(() => {
    if (!isAdmin) return;
    const stub = newStubRepFirm(editorDisplayName);
    onAddRepFirm(stub);
    const form = repFirmFormFromRow(stub);
    setEditingFirmId(stub.id);
    setEditForm(form);
    setAttachDraftIds([]);
    setAttachSearchQuery("");
    setUsePerProductContacts(false);
    setPerProductContacts({});
    setEditBaseline(repFirmEditSnapshot(form, [], false, {}));
    setDialogOpen(true);
  }, [isAdmin, editorDisplayName, onAddRepFirm]);

  const repFirmScrollKey = searchParams.get("repFirm");
  useEffect(() => {
    if (!repFirmScrollKey) return;
    if (openedUrlRef.current === repFirmScrollKey) return;
    const row = repFirms.find((r) => r.id === repFirmScrollKey);
    if (!row) return;
    openedUrlRef.current = repFirmScrollKey;
    if (!isAdmin) {
      requestAnimationFrame(() => {
        document.getElementById(repFirmCatalogDomId(repFirmScrollKey))?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
      return;
    }
    beginEditFirm(row);
  }, [repFirmScrollKey, repFirms, beginEditFirm, isAdmin]);

  useEffect(() => {
    if (!repFirmScrollKey) openedUrlRef.current = null;
  }, [repFirmScrollKey]);

  useEffect(() => {
    if (!isAdmin && dialogOpen) {
      clearDialogSession();
    }
  }, [isAdmin, dialogOpen, clearDialogSession]);

  useLayoutEffect(() => {
    if (!dialogOpen) {
      repFirmDirtyRef.current = false;
      return;
    }
    repFirmDirtyRef.current = isRepFirmEditDirty();
  }, [dialogOpen, isRepFirmEditDirty]);

  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (repFirmDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, []);

  useEffect(() => {
    if (!onDirtyChange) return;
    if (!dialogOpen) {
      onDirtyChange(false);
      return;
    }
    onDirtyChange(isRepFirmEditDirty());
  }, [onDirtyChange, dialogOpen, isRepFirmEditDirty]);

  useLayoutEffect(() => {
    if (!repTabVisible) {
      onEditorSurfaceChange?.(false);
      return;
    }
    onEditorSurfaceChange?.(Boolean(dialogOpen && editForm));
  }, [repTabVisible, dialogOpen, editForm, onEditorSurfaceChange]);

  useLayoutEffect(() => {
    if (!dialogOpen || !editForm) return;
    // Do not call scrollIntoView on #rep-firm-editor — it can scroll the page / outer shell when the
    // browse column is overflow-hidden. Only the editor body should scroll.
    repFirmEditorScrollRef.current?.scrollTo({ top: 0 });
  }, [dialogOpen, editForm, editingFirmId]);

  const saveDialog = () => {
    if (!isAdmin) return;
    if (!editForm?.name.trim() || !isRepFirmEditDirty()) return;
    if (!editingFirmId) return;
    const patch = parseRepFirmPatch(editForm, attachDraftIds.length);
    const scopeSync = firmRowForDialog?.scope ?? TEAM_EVERYONE_ID;
    const statusSync = firmRowForDialog?.status ?? "active";
    onSaveRepFirm(editingFirmId, patch);
    onSyncRepFirmProductLinks({
      repFirmId: editingFirmId,
      attachedProductIds: attachDraftIds,
      firmName: editForm.name.trim(),
      firmScope: scopeSync,
      firmStatus: statusSync,
      usePerProductContacts,
      perProductContacts,
      firmContact: {},
    });
    clearDialogSession();
    toast({ title: "Rep firm saved", tone: "success" });
  };

  const firmRowForDialog = editingFirmId ? repFirms.find((f) => f.id === editingFirmId) : null;

  const attachableRowsForTable = useMemo(() => {
    const list = attachDraftIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is DirectoryProduct => !!p);
    const dir = tableSort.dir === "asc" ? 1 : -1;
    const loc = (p: DirectoryProduct) =>
      [p.city, p.country].filter(Boolean).join(", ") || p.location || "";
    const topProg = (p: DirectoryProduct) =>
      p.partnerPrograms?.find((pp) => isProgramBookable(pp)) ?? p.partnerPrograms?.[0];
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (tableSort.key === "name") cmp = a.name.localeCompare(b.name);
      else if (tableSort.key === "location") cmp = loc(a).localeCompare(loc(b));
      else if (tableSort.key === "type") cmp = directoryProductTypeShortLabel(a).localeCompare(
        directoryProductTypeShortLabel(b)
      );
      else if (tableSort.key === "program") {
        const pa = topProg(a);
        const pb = topProg(b);
        cmp = (pa ? programDisplayName(pa) : "").localeCompare(pb ? programDisplayName(pb) : "");
      } else if (tableSort.key === "notes") {
        const na = usePerProductContacts ? perProductContacts[a.id]?.notes ?? "" : "";
        const nb = usePerProductContacts ? perProductContacts[b.id]?.notes ?? "" : "";
        cmp = na.localeCompare(nb);
      } else if (tableSort.key === "market") {
        const ma = usePerProductContacts ? perProductContacts[a.id]?.market ?? "" : "";
        const mb = usePerProductContacts ? perProductContacts[b.id]?.market ?? "" : "";
        cmp = ma.localeCompare(mb);
      }
      if (cmp !== 0) return cmp * dir;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [
    attachDraftIds,
    products,
    tableSort,
    usePerProductContacts,
    perProductContacts,
  ]);

  const toggleSort = (key: SortKey) => {
    setTableSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const repFirmDiscardDialogEl = (
    <Dialog
      open={!!discardDialog}
      onOpenChange={(open) => {
        if (!open) setDiscardDialog(null);
      }}
    >
      <DialogContent className="border-input bg-popover sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-foreground">{discardDialog?.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{discardDialog?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setDiscardDialog(null)}>
            Keep editing
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => discardDialog?.onConfirm()}
          >
            {discardDialog?.confirmLabel ?? "Discard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const showRepFirmEditor = dialogOpen && !!editForm;

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-none",
        showRepFirmEditor ? "flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden" : "space-y-6"
      )}
    >
      {!showRepFirmEditor ? (
      <div className="sticky top-0 z-20 -mx-6 space-y-3 border-b border-border bg-inset px-6 pb-3 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 basis-[min(100%,20rem)]">
            <PageSearchField
              value={query}
              onChange={setQuery}
              placeholder="Search rep firms, regions, contacts…"
              aria-label="Search rep firms"
            />
          </div>
          {!isAdmin ? (
            <Button
              type="button"
              variant="toolbarAccent"
              size="sm"
              onClick={() => setShowSuggestDialog(true)}
              className="shrink-0"
            >
              Suggest change
            </Button>
          ) : (
            <Button
              type="button"
              variant="toolbarAccent"
              size="sm"
              onClick={beginAddFirm}
              className="shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add rep firm
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RepFirmSingleSelectDropdown
            placeholder="Region"
            value={regionFilter}
            options={availableRegions}
            onChange={setRegionFilter}
            maxWidthClassName="max-w-[190px]"
            ariaLabel="Filter rep firms by region"
            searchPlaceholder="Search regions…"
          />
          <RepFirmSingleSelectDropdown
            placeholder="Specialty"
            value={specialtyFilter}
            options={[...REP_FIRM_SPECIALTIES]}
            onChange={setSpecialtyFilter}
            maxWidthClassName="max-w-[220px]"
            ariaLabel="Filter rep firms by specialty"
            searchPlaceholder="Search specialties…"
            formatOption={(o) => defaultFormatOption(o)}
          />
          {(regionFilter !== "all" || specialtyFilter !== "all") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setRegionFilter("all");
                setSpecialtyFilter("all");
              }}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
      ) : null}
      {dialogOpen && editForm ? (
        <section
          id="rep-firm-editor"
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-popover shadow-sm"
        >
          <div className="shrink-0 border-b border-border/80 bg-popover px-4 py-2 sm:px-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold leading-tight tracking-tight text-foreground sm:text-[15px]">
                  {editForm.name.trim() || "Rep firm"}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Close"
                onClick={() => requestCloseDialog(isRepFirmEditDirty())}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="mt-2 border-t border-border/50 pt-1.5">
              <DirectoryEditorSectionNav
                ariaLabel="Jump to rep firm section"
                sections={[
                  { id: REP_FIRM_EDITOR_SECTION_IDS.firm, label: "Firm" },
                  { id: REP_FIRM_EDITOR_SECTION_IDS.contacts, label: "Contacts" },
                  { id: REP_FIRM_EDITOR_SECTION_IDS.web, label: "Web & social" },
                  { id: REP_FIRM_EDITOR_SECTION_IDS.links, label: "Linked products" },
                ]}
                scrollContainerRef={repFirmEditorScrollRef}
                onBackToTop={() =>
                  repFirmEditorScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
                }
              />
            </div>
          </div>

          <div
            ref={repFirmEditorScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-5 pt-3 sm:px-5 sm:pb-6"
          >
                <div className="space-y-6">
                  <div id={REP_FIRM_EDITOR_SECTION_IDS.firm}>
                    <RepFirmEditorSectionHeading>Firm details</RepFirmEditorSectionHeading>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">Firm name</span>
                        <input
                          value={editForm.name}
                          disabled={!isAdmin}
                          onChange={(e) => setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                          className={REP_FIRM_INPUT_CLASS}
                        />
                      </label>
                      {firmRowForDialog ? (
                        <div className="sm:col-span-2">
                          <RepFirmCatalogLuxProvenance row={firmRowForDialog} />
                        </div>
                      ) : null}
                      <div className="sm:col-span-2">
                        <span className="mb-2 block text-2xs font-medium text-muted-foreground">Specialties</span>
                        <RepFirmSpecialtyMultiSelect
                          value={editForm.specialty}
                          disabled={!isAdmin}
                          onChange={(next) => setEditForm((prev) => (prev ? { ...prev, specialty: next } : prev))}
                        />
                      </div>
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">
                          Regions covered (comma-separated)
                        </span>
                        <input
                          value={editForm.regionsText}
                          disabled={!isAdmin}
                          onChange={(e) =>
                            setEditForm((prev) => (prev ? { ...prev, regionsText: e.target.value } : prev))
                          }
                          className={REP_FIRM_INPUT_CLASS}
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">
                          Main phone number
                        </span>
                        <input
                          value={editForm.phone}
                          disabled={!isAdmin}
                          onChange={(e) => setEditForm((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                          className={REP_FIRM_INPUT_CLASS}
                          type="tel"
                          autoComplete="tel"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">
                          HQ address (city and country can be included in this line)
                        </span>
                        <input
                          value={editForm.hqAddress}
                          disabled={!isAdmin}
                          onChange={(e) =>
                            setEditForm((prev) => (prev ? { ...prev, hqAddress: e.target.value } : prev))
                          }
                          className={REP_FIRM_INPUT_CLASS}
                          autoComplete="street-address"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">Logo image URL</span>
                        <input
                          value={editForm.logoUrl}
                          disabled={!isAdmin}
                          onChange={(e) =>
                            setEditForm((prev) => (prev ? { ...prev, logoUrl: e.target.value } : prev))
                          }
                          className={REP_FIRM_INPUT_CLASS}
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">Internal notes</span>
                        <textarea
                          value={editForm.notes}
                          disabled={!isAdmin}
                          onChange={(e) =>
                            setEditForm((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
                          }
                          rows={3}
                          className={REP_FIRM_TEXTAREA_CLASS}
                        />
                      </label>
                    </div>
                  </div>

                  <div id={REP_FIRM_EDITOR_SECTION_IDS.contacts}>
                    <RepFirmEditorSectionHeading>Contacts</RepFirmEditorSectionHeading>
                    {!isAdmin ? (
                      <RepFirmContactsLuxReadonlyTable
                        contacts={editForm.contacts.map((d) => contactDraftToDisplayRow(d))}
                        firmName={editForm.name.trim() || undefined}
                        attribution={firmRowForDialog?.name}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className={listTableClass("min-w-[720px]")}>
                            <thead className={listTheadRowClass}>
                              <tr>
                                <th className={cn(listThClass, "text-xs")}>Name</th>
                                <th className={cn(listThClass, "text-xs")}>Title</th>
                                <th className={cn(listThClass, "min-w-[140px] text-xs")}>Phone numbers</th>
                                <th className={cn(listThClass, "min-w-[160px] text-xs")}>Email addresses</th>
                                <th className={cn(listThClass, "w-[52px] text-right text-xs")} />
                              </tr>
                            </thead>
                            <tbody>
                              {editForm.contacts.map((c) => (
                                <tr key={c._cid} className={listTbodyRowClass}>
                                  <td className={cn(listTdClass, "p-1.5 align-top")}>
                                    <input
                                      value={c.name}
                                      onChange={(e) =>
                                        setEditForm((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                contacts: prev.contacts.map((row) =>
                                                  row._cid === c._cid ? { ...row, name: e.target.value } : row
                                                ),
                                              }
                                            : prev
                                        )
                                      }
                                      className={REP_FIRM_CONTACT_EDIT_INPUT}
                                      aria-label="Contact name"
                                    />
                                  </td>
                                  <td className={cn(listTdClass, "p-1.5 align-top")}>
                                    <input
                                      value={c.title ?? ""}
                                      onChange={(e) =>
                                        setEditForm((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                contacts: prev.contacts.map((row) =>
                                                  row._cid === c._cid
                                                    ? { ...row, title: e.target.value || null }
                                                    : row
                                                ),
                                              }
                                            : prev
                                        )
                                      }
                                      className={REP_FIRM_CONTACT_EDIT_INPUT}
                                      aria-label="Title"
                                    />
                                  </td>
                                  <td className={cn(listTdClass, "min-w-[140px] p-1.5 align-top")}>
                                    <div className="flex flex-col gap-1">
                                      {c.phoneRows.map((ph, i) => (
                                        <div key={`ph-${c._cid}-${i}`} className="flex gap-0.5">
                                          <input
                                            value={ph}
                                            onChange={(e) =>
                                              setEditForm((prev) =>
                                                prev
                                                  ? {
                                                      ...prev,
                                                      contacts: prev.contacts.map((row) =>
                                                        row._cid === c._cid
                                                          ? {
                                                              ...row,
                                                              phoneRows: row.phoneRows.map((v, j) =>
                                                                j === i ? e.target.value : v
                                                              ),
                                                            }
                                                          : row
                                                      ),
                                                    }
                                                  : prev
                                              )
                                            }
                                            className={cn(REP_FIRM_CONTACT_EDIT_INPUT, "tabular-nums")}
                                            placeholder="Phone number (optional)"
                                            type="tel"
                                            autoComplete="tel"
                                            aria-label={`Phone number ${i + 1}`}
                                          />
                                          {c.phoneRows.length > 1 ? (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                                              aria-label="Remove this phone number"
                                              onClick={() =>
                                                setEditForm((prev) =>
                                                  prev
                                                    ? {
                                                        ...prev,
                                                        contacts: prev.contacts.map((row) =>
                                                          row._cid === c._cid
                                                            ? {
                                                                ...row,
                                                                phoneRows:
                                                                  row.phoneRows.length <= 1
                                                                    ? row.phoneRows
                                                                    : row.phoneRows.filter((_, j) => j !== i),
                                                              }
                                                            : row
                                                        ),
                                                      }
                                                    : prev
                                                )
                                              }
                                            >
                                              <X className="h-3.5 w-3.5" aria-hidden />
                                            </Button>
                                          ) : null}
                                        </div>
                                      ))}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 self-start px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                          setEditForm((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  contacts: prev.contacts.map((row) =>
                                                    row._cid === c._cid
                                                      ? { ...row, phoneRows: [...row.phoneRows, ""] }
                                                      : row
                                                  ),
                                                }
                                              : prev
                                          )
                                        }
                                      >
                                        <Plus className="mr-0.5 h-3 w-3" aria-hidden />
                                        Add phone number
                                      </Button>
                                    </div>
                                  </td>
                                  <td className={cn(listTdClass, "min-w-[160px] p-1.5 align-top")}>
                                    <div className="flex flex-col gap-1">
                                      {c.emailRows.map((em, i) => (
                                        <div key={`em-${c._cid}-${i}`} className="flex gap-0.5">
                                          <input
                                            value={em}
                                            onChange={(e) =>
                                              setEditForm((prev) =>
                                                prev
                                                  ? {
                                                      ...prev,
                                                      contacts: prev.contacts.map((row) =>
                                                        row._cid === c._cid
                                                          ? {
                                                              ...row,
                                                              emailRows: row.emailRows.map((v, j) =>
                                                                j === i ? e.target.value : v
                                                              ),
                                                            }
                                                          : row
                                                      ),
                                                    }
                                                  : prev
                                              )
                                            }
                                            className={REP_FIRM_CONTACT_EDIT_INPUT}
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            placeholder="Email address (optional)"
                                            aria-label={`Email address ${i + 1}`}
                                          />
                                          {c.emailRows.length > 1 ? (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                                              aria-label="Remove this email address"
                                              onClick={() =>
                                                setEditForm((prev) =>
                                                  prev
                                                    ? {
                                                        ...prev,
                                                        contacts: prev.contacts.map((row) =>
                                                          row._cid === c._cid
                                                            ? {
                                                                ...row,
                                                                emailRows:
                                                                  row.emailRows.length <= 1
                                                                    ? row.emailRows
                                                                    : row.emailRows.filter((_, j) => j !== i),
                                                              }
                                                            : row
                                                        ),
                                                      }
                                                    : prev
                                                )
                                              }
                                            >
                                              <X className="h-3.5 w-3.5" aria-hidden />
                                            </Button>
                                          ) : null}
                                        </div>
                                      ))}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 self-start px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                          setEditForm((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  contacts: prev.contacts.map((row) =>
                                                    row._cid === c._cid
                                                      ? { ...row, emailRows: [...row.emailRows, ""] }
                                                      : row
                                                  ),
                                                }
                                              : prev
                                          )
                                        }
                                      >
                                        <Plus className="mr-0.5 h-3 w-3" aria-hidden />
                                        Add email address
                                      </Button>
                                    </div>
                                  </td>
                                  <td className={cn(listTdClass, "p-1.5 text-right align-top")}>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 px-0 text-[#A66B6B]"
                                      aria-label="Remove contact"
                                      onClick={() =>
                                        setEditForm((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                contacts: prev.contacts.filter((x) => x._cid !== c._cid),
                                              }
                                            : prev
                                        )
                                      }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditForm((prev) =>
                              prev ? { ...prev, contacts: [...prev.contacts, newContactDraft()] } : prev
                            )
                          }
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
                          Add contact
                        </Button>
                      </div>
                    )}
                  </div>

                  <div id={REP_FIRM_EDITOR_SECTION_IDS.web}>
                    <RepFirmEditorSectionHeading>Website &amp; social</RepFirmEditorSectionHeading>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">Website URL</span>
                        <input
                          value={editForm.websiteUrl}
                          disabled={!isAdmin}
                          onChange={(e) =>
                            setEditForm((prev) => (prev ? { ...prev, websiteUrl: e.target.value } : prev))
                          }
                          className={REP_FIRM_INPUT_CLASS}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-2xs font-medium text-muted-foreground">Portal URL</span>
                        <input
                          value={editForm.portalUrl}
                          disabled={!isAdmin}
                          onChange={(e) =>
                            setEditForm((prev) => (prev ? { ...prev, portalUrl: e.target.value } : prev))
                          }
                          className={REP_FIRM_INPUT_CLASS}
                        />
                      </label>
                      {isAdmin ? (
                        <label className="block sm:col-span-2">
                          <span className="mb-1 block text-2xs font-medium text-amber-200/90">
                            Portal credentials note (admin-only)
                          </span>
                          <textarea
                            value={editForm.portalCredentialsNote}
                            disabled={!isAdmin}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, portalCredentialsNote: e.target.value } : prev
                              )
                            }
                            rows={2}
                            className={REP_FIRM_TEXTAREA_CLASS}
                          />
                        </label>
                      ) : null}
                      <div className="sm:col-span-2">
                        <span className="mb-2 block text-2xs font-medium text-muted-foreground">Social media</span>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input
                            placeholder="Facebook URL"
                            value={editForm.socialFacebook}
                            disabled={!isAdmin}
                            onChange={(e) =>
                              setEditForm((prev) => (prev ? { ...prev, socialFacebook: e.target.value } : prev))
                            }
                            className={REP_FIRM_INPUT_CLASS}
                          />
                          <input
                            placeholder="Instagram URL"
                            value={editForm.socialInstagram}
                            disabled={!isAdmin}
                            onChange={(e) =>
                              setEditForm((prev) => (prev ? { ...prev, socialInstagram: e.target.value } : prev))
                            }
                            className={REP_FIRM_INPUT_CLASS}
                          />
                          <input
                            placeholder="LinkedIn URL"
                            value={editForm.socialLinkedin}
                            disabled={!isAdmin}
                            onChange={(e) =>
                              setEditForm((prev) => (prev ? { ...prev, socialLinkedin: e.target.value } : prev))
                            }
                            className={REP_FIRM_INPUT_CLASS}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id={REP_FIRM_EDITOR_SECTION_IDS.links}>
                    <RepFirmEditorSectionHeading>Linked products</RepFirmEditorSectionHeading>
                    <div className="rounded-xl border border-border bg-inset/35 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-medium text-foreground">Attach products</p>
                        <label className="flex items-center gap-2 text-2xs text-muted-foreground">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={usePerProductContacts}
                            onChange={(e) => {
                              const next = e.target.checked;
                              setUsePerProductContacts(next);
                              if (next) {
                                setPerProductContacts((prev) => {
                                  const merged = { ...prev };
                                  attachDraftIds.forEach((id) => {
                                    if (!merged[id]) merged[id] = emptyPerProductDraft();
                                  });
                                  return merged;
                                });
                              }
                            }}
                            className="checkbox-on-dark"
                          />
                          Contact &amp; notes per property
                        </label>
                      </div>
                      {usePerProductContacts ? (
                        <p className="mt-1 text-2xs text-muted-foreground">
                          Edit contact name, phones, emails, market, and notes in the linked-products table below.
                        </p>
                      ) : null}
                      <div className="mt-2">
                        <PageSearchField
                          variant="compact"
                          value={attachSearchQuery}
                          onChange={setAttachSearchQuery}
                          placeholder="Search products to attach…"
                          aria-label="Search products to attach to this rep firm"
                        />
                      </div>
                      <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                        {catalogProductsForRepFirmAttach
                          .filter(
                            (p) =>
                              attachDraftIds.includes(p.id) ||
                              productMatchesPartnerAttachSearch(p, attachSearchQuery)
                          )
                          .sort((a, b) => {
                            const ca = attachDraftIds.includes(a.id) ? 0 : 1;
                            const cb = attachDraftIds.includes(b.id) ? 0 : 1;
                            if (ca !== cb) return ca - cb;
                            return a.name.localeCompare(b.name);
                          })
                          .map((p) => {
                            const on = attachDraftIds.includes(p.id);
                            return (
                              <div key={p.id} className="rounded-md border border-border bg-inset p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <label className="flex min-w-0 items-center gap-2 text-2xs text-foreground">
                                    <input
                                      type="checkbox"
                                      disabled={!isAdmin}
                                      checked={on}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setAttachDraftIds((prev) =>
                                          checked
                                            ? Array.from(new Set([...prev, p.id]))
                                            : prev.filter((id) => id !== p.id)
                                        );
                                        if (checked && usePerProductContacts) {
                                          setPerProductContacts((prev) =>
                                            prev[p.id] ? prev : { ...prev, [p.id]: emptyPerProductDraft() }
                                          );
                                        }
                                      }}
                                      className="checkbox-on-dark"
                                    />
                                    <span className="truncate">{p.name}</span>
                                  </label>
                                  <span className="shrink-0 text-[9px] text-muted-foreground">
                                    {directoryProductTypeShortLabel(p)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {attachDraftIds.length > 0 ? (
                        <div className="mt-4 overflow-x-auto">
                          {usePerProductContacts ? (
                            <table className={listTableClass("min-w-[1040px]")}>
                              <thead className={listTheadRowClass}>
                                <tr>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("name")}
                                    >
                                      Product
                                      {tableSort.key === "name" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("location")}
                                    >
                                      Location
                                      {tableSort.key === "location"
                                        ? tableSort.dir === "asc"
                                          ? " ↑"
                                          : " ↓"
                                        : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("type")}
                                    >
                                      Type
                                      {tableSort.key === "type" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("program")}
                                    >
                                      Partner program
                                      {tableSort.key === "program" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("market")}
                                    >
                                      Market
                                      {tableSort.key === "market" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                  <th className={cn(listThClass, "text-xs")}>Contact name</th>
                                  <th className={cn(listThClass, "text-xs")}>Phone numbers</th>
                                  <th className={cn(listThClass, "text-xs")}>Email addresses</th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("notes")}
                                    >
                                      Notes
                                      {tableSort.key === "notes" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {attachableRowsForTable.map((p) => {
                                  const draft = perProductContacts[p.id] ?? emptyPerProductDraft();
                                  return (
                                    <LinkedPropertyPerProductContactRow
                                      key={p.id}
                                      product={p}
                                      draft={draft}
                                      disabled={!isAdmin}
                                      canViewCommissions={canViewCommissions}
                                      onSelectProduct={onSelectProduct}
                                      onReplaceDraft={(next) =>
                                        setPerProductContacts((prev) => ({ ...prev, [p.id]: next }))
                                      }
                                    />
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <table className={listTableClass("min-w-[720px]")}>
                              <thead className={listTheadRowClass}>
                                <tr>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("name")}
                                    >
                                      Product
                                      {tableSort.key === "name" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("location")}
                                    >
                                      Location
                                      {tableSort.key === "location"
                                        ? tableSort.dir === "asc"
                                          ? " ↑"
                                          : " ↓"
                                        : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("type")}
                                    >
                                      Type
                                      {tableSort.key === "type" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("program")}
                                    >
                                      Partner program
                                      {tableSort.key === "program" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("market")}
                                    >
                                      Market
                                      {tableSort.key === "market" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                  <th className={listThClass}>
                                    <button
                                      type="button"
                                      className="font-medium text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleSort("notes")}
                                    >
                                      Notes
                                      {tableSort.key === "notes" ? (tableSort.dir === "asc" ? " ↑" : " ↓") : ""}
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {attachableRowsForTable.map((p) => {
                                  const place =
                                    [p.city, p.country].filter(Boolean).join(", ") || p.location || "—";
                                  const topProg =
                                    p.partnerPrograms?.find((pp) => isProgramBookable(pp)) ??
                                    p.partnerPrograms?.[0];
                                  const linkRow = p.repFirmLinks?.find((l) => l.repFirmId === editingFirmId);
                                  const notes = linkRow?.notes ?? "";
                                  const market = linkRow?.market ?? "";
                                  return (
                                    <tr key={p.id} className={listTbodyRowClass}>
                                      <td className={listTdClass}>
                                        <button
                                          type="button"
                                          className="text-left font-medium text-foreground hover:underline"
                                          onClick={() => onSelectProduct(p.id)}
                                        >
                                          {p.name}
                                        </button>
                                      </td>
                                      <td className={listTdClass + " text-muted-foreground"}>{place}</td>
                                      <td className={listTdClass + " text-muted-foreground"}>
                                        {directoryProductTypeShortLabel(p)}
                                      </td>
                                      <td className={listTdClass + " text-muted-foreground"}>
                                        {topProg ? (
                                          <span>
                                            {programDisplayName(topProg)}
                                            {canViewCommissions && isProgramBookable(topProg) ? (
                                              <span className="ml-1 text-[10px] text-muted-foreground">
                                                {programDisplayCommissionRate(topProg)}%
                                              </span>
                                            ) : null}
                                          </span>
                                        ) : (
                                          "—"
                                        )}
                                      </td>
                                      <td className={listTdClass + " text-muted-foreground"}>{market || "—"}</td>
                                      <td className={listTdClass + " max-w-[200px] truncate text-muted-foreground"}>
                                        {notes || "—"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-2xs text-muted-foreground">No products attached yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-20 flex shrink-0 flex-wrap items-center gap-2 border-t border-border/80 bg-popover/95 px-4 py-3.5 shadow-[0_-10px_28px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:px-6">
                <div className="mr-auto flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                  {isAdmin && editingFirmId ? (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-fit shrink-0"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      Delete firm
                    </Button>
                  ) : null}
                  {isRepFirmEditDirty() ? (
                    <p className="text-2xs text-muted-foreground">Unsaved changes</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => requestCloseDialog(isRepFirmEditDirty())}
                >
                  {isRepFirmEditDirty() ? "Discard changes" : "Cancel"}
                </Button>
                {isAdmin ? (
                  <Button
                    id="rep-firm-editor-save"
                    type="button"
                    disabled={!editForm.name.trim() || !isRepFirmEditDirty()}
                    onClick={saveDialog}
                    className="bg-[#B07A5B] text-white hover:bg-[#c08a6f] disabled:opacity-40"
                  >
                    Save
                  </Button>
                ) : null}
                </div>
              </div>
        </section>
      ) : null}

      {!showRepFirmEditor ? (
      filteredRepFirms.length === 0 ? (
        <div className="rounded-xl border border-border bg-foreground/[0.03] px-6 py-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-[#B07A5B]/70" />
          <p className="text-compact font-medium text-foreground">No rep firms match</p>
          <p className="mt-1 text-xs text-muted-foreground">Try another search term.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRepFirms.map((row) => {
            const linked = linkedProductMap.get(row.id) ?? [];
            const catalogDesc = repFirmCatalogDescriptionText(row);
            const firmCatalogCardBody = (
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{row.name}</h3>
                    <span className="rounded-full bg-[rgba(176,122,91,0.12)] px-2 py-0.5 text-[9px] text-[#B07A5B]">
                      {linked.length > 0 ? linked.length : row.propertyCount ?? 0} products
                    </span>
                  </div>
                  <RepFirmCatalogLuxProvenance row={row} />
                  <p className="mt-1.5 text-2xs text-muted-foreground">
                    {row.regionsCovered.join(", ") || "—"}
                  </p>
                  {catalogDesc ? (
                    <p className="mt-1.5 line-clamp-4 text-2xs leading-relaxed text-muted-foreground">
                      {catalogDesc}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.specialty.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted-foreground"
                      >
                        {REP_FIRM_SPECIALTY_LABELS[s]}
                      </span>
                    ))}
                  </div>
                  {row.contacts.length > 0 ? (
                    <div className="mt-2 border-t border-border/60 pt-2">
                      <RepFirmContactsLuxReadonlyTable
                        contacts={row.contacts}
                        firmName={row.name}
                        maxRows={3}
                        compact
                        heading={null}
                      />
                    </div>
                  ) : null}
                  <RepFirmCatalogWebSocialIcons row={row} />
                </div>
              </div>
            );
            return (
              <div
                key={row.id}
                id={repFirmCatalogDomId(row.id)}
                className="scroll-mt-4 overflow-hidden rounded-2xl border border-border bg-popover"
              >
                <div className="relative w-full p-4 text-left">
                  {isAdmin ? (
                    <EditIconButton
                      label={`Edit ${row.name}`}
                      className="absolute right-3 top-3 z-0"
                      onClick={() => beginEditFirm(row)}
                    />
                  ) : null}
                  <div className={cn(isAdmin && "pr-11")}>{firmCatalogCardBody}</div>
                </div>

                {linked.length > 0 ? (
                  <div className="border-t border-border bg-inset/35 px-3 py-2 sm:px-4">
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/65">
                        Linked products
                        <span className="ml-1.5 font-medium tabular-nums text-muted-foreground/90">
                          ({linked.length})
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBrowseByRepFirm(row.id);
                        }}
                        className="shrink-0 rounded-md border border-[rgba(176,122,91,0.30)] bg-[rgba(176,122,91,0.10)] px-2 py-1 text-[10px] font-medium text-[#B07A5B] hover:bg-[rgba(176,122,91,0.15)]"
                      >
                        View all in Products
                      </button>
                    </div>
                    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                      {linked.map((item) => (
                        <RepFirmLinkedProductStripTile
                          key={item.product.id}
                          product={item.product}
                          canViewCommissions={canViewCommissions}
                          onSelect={() => onSelectProduct(item.product.id)}
                          brokenImage={!!linkedProductBrokenImages[item.product.id]}
                          onImageError={() =>
                            setLinkedProductBrokenImages((prev) =>
                              prev[item.product.id] ? prev : { ...prev, [item.product.id]: true }
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border px-3 py-2 sm:px-4">
                    <p className="text-[10px] text-muted-foreground">
                      No catalog products linked yet. Admins can open a firm above to attach products.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )
      ) : null}


      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="border-border bg-popover sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete rep firm?</DialogTitle>
            <DialogDescription>
              This removes the firm from the registry. Product links to this firm will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!isAdmin) return;
                if (editingFirmId) {
                  onRemoveRepFirm(editingFirmId);
                  setDeleteConfirmOpen(false);
                  clearDialogSession();
                  toast({ title: "Rep firm removed", tone: "success" });
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showRepFirmEditor && suggestions.length > 0 ? (
        <div className="rounded-xl border border-border bg-foreground/[0.03] p-3">
          <p className="mb-2 text-xs font-medium text-foreground">Pending suggestions</p>
          <div className="space-y-1.5">
            {suggestions.map((s) => (
              <div key={s.id} className="rounded-lg border border-white/[0.04] bg-foreground/[0.03] px-2.5 py-2">
                <p className="text-2xs text-foreground">{s.repFirmName || "General suggestion"}</p>
                <p className="mt-0.5 text-2xs text-muted-foreground">{s.note}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  Suggested by {s.suggestedBy} · pending admin review
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {repFirmDiscardDialogEl}

      <Dialog open={showSuggestDialog} onOpenChange={setShowSuggestDialog}>
        <DialogContent className="border-border bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest rep firm update</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Share changes or propose a new rep firm for admin review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input
              value={suggestedFirmName}
              onChange={(e) => setSuggestedFirmName(e.target.value)}
              placeholder="Rep firm name"
              className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
            />
            <textarea
              value={suggestionNote}
              onChange={(e) => setSuggestionNote(e.target.value)}
              rows={4}
              placeholder="What should be updated?"
              className="w-full resize-none rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowSuggestDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!suggestionNote.trim()) return;
                setSuggestions((prev) => [
                  {
                    id: `rfs-${Date.now()}`,
                    repFirmName: suggestedFirmName.trim(),
                    note: suggestionNote.trim(),
                    suggestedBy: editorDisplayName,
                    createdAt: new Date().toISOString(),
                    status: "pending",
                  },
                  ...prev,
                ]);
                setShowSuggestDialog(false);
                setSuggestedFirmName("");
                setSuggestionNote("");
              }}
              className="border-[rgba(176,122,91,0.30)] bg-[rgba(176,122,91,0.10)] text-[#B07A5B] hover:bg-[rgba(176,122,91,0.15)]"
            >
              Submit suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
