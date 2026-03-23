"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Award,
  Bookmark,
  Building2,
  ChevronLeft,
  Compass,
  Globe,
  LayoutGrid,
  Lock,
  Map as MapIcon,
  Plus,
  Search,
  Share2,
  Ship,
  Users,
  Check,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard, SkeletonRow, Spinner } from "@/components/ui/SkeletonPatterns";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { ShareWithTeamDropdown } from "@/components/ui/ShareWithTeamDropdown";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import { TEAM_EVERYONE_ID } from "@/types/teams";

type ProductType = "hotel" | "dmc" | "experience" | "cruise";

type DirectoryProduct = {
  id: string;
  name: string;
  type: ProductType;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  hasTeamData: boolean;
  hasAdvisorNotes: boolean;
};

type Collection = {
  id: string;
  name: string;
  description?: string;
  scope: "private" | string;
  ownerId: string;
  ownerName: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
};

const productTypes: { id: ProductType; label: string; icon: typeof Building2; color: string }[] = [
  { id: "hotel", label: "Hotel / Resort", icon: Building2, color: "text-blue-400" },
  { id: "dmc", label: "DMC", icon: Globe, color: "text-emerald-400" },
  { id: "experience", label: "Experience / Tour", icon: Compass, color: "text-amber-400" },
  { id: "cruise", label: "Cruise", icon: Ship, color: "text-violet-400" },
];

const MOCK_PRODUCTS: DirectoryProduct[] = [
  {
    id: "prod-001",
    name: "Aman Tokyo",
    type: "hotel",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.6762,
    longitude: 139.6503,
    description:
      "Urban sanctuary in the heart of Tokyo, blending traditional Japanese aesthetics with contemporary minimalism.",
    hasTeamData: true,
    hasAdvisorNotes: true,
  },
  {
    id: "prod-002",
    name: "Four Seasons Kyoto",
    type: "hotel",
    city: "Kyoto",
    country: "Japan",
    latitude: 34.9869,
    longitude: 135.7781,
    description: "Elegant property surrounded by an 800-year-old pond garden.",
    hasTeamData: true,
    hasAdvisorNotes: false,
  },
  {
    id: "prod-003",
    name: "One&Only Reethi Rah",
    type: "hotel",
    city: "North Malé Atoll",
    country: "Maldives",
    latitude: 4.4239,
    longitude: 73.4668,
    description: "Private island resort with overwater villas and 12 dining venues.",
    hasTeamData: true,
    hasAdvisorNotes: true,
  },
  {
    id: "prod-004",
    name: "Cheval Blanc St-Barth",
    type: "hotel",
    city: "St. Barthélemy",
    country: "France",
    latitude: 17.8963,
    longitude: -62.8498,
    description: "LVMH luxury on the beach at Baie des Flamands.",
    hasTeamData: false,
    hasAdvisorNotes: false,
  },
  {
    id: "prod-dmc-001",
    name: "Bali Luxury Concierge — Dima",
    type: "dmc",
    city: "Ubud",
    country: "Indonesia",
    latitude: -8.5069,
    longitude: 115.2625,
    description: "High-end destination management in Bali.",
    hasTeamData: true,
    hasAdvisorNotes: true,
  },
  {
    id: "prod-exp-001",
    name: "Private Tea Ceremony — Kyoto",
    type: "experience",
    city: "Kyoto",
    country: "Japan",
    latitude: 35.0116,
    longitude: 135.7681,
    description: "Two-hour private tea ceremony in a 16th-century machiya townhouse.",
    hasTeamData: false,
    hasAdvisorNotes: true,
  },
  {
    id: "prod-cruise-001",
    name: "Silversea — Mediterranean Grand Voyage",
    type: "cruise",
    city: "Monte Carlo",
    country: "Monaco",
    latitude: 43.7384,
    longitude: 7.4246,
    description: "14-night luxury cruise from Monte Carlo to Istanbul via the Greek Islands.",
    hasTeamData: true,
    hasAdvisorNotes: false,
  },
];

const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: "col-001",
    name: "Smith Family — Japan Options",
    description: "Hotels and experiences for the Smith Japan trip, April 2026",
    scope: "private",
    ownerId: "user-janet",
    ownerName: "Janet",
    productIds: ["prod-001", "prod-002", "prod-exp-001"],
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-03-18T14:00:00Z",
  },
  {
    id: "col-002",
    name: "TravelLustre Preferred Hotels 2026",
    description: "Our top recommended hotels across all destinations",
    scope: TEAM_EVERYONE_ID,
    ownerId: "user-kristin",
    ownerName: "Kristin",
    productIds: ["prod-001", "prod-003", "prod-004", "prod-dmc-001"],
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-03-16T11:00:00Z",
  },
  {
    id: "col-003",
    name: "My Go-To Maldives Hotels",
    scope: "private",
    ownerId: "user-janet",
    ownerName: "Janet",
    productIds: ["prod-003", "prod-004"],
    createdAt: "2026-02-20T15:00:00Z",
    updatedAt: "2026-03-01T09:00:00Z",
  },
];

const COUNTRY_OPTIONS = ["Japan", "Maldives", "France", "Indonesia", "Italy", "Monaco"];

function getInitialCollections(): Collection[] {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PD_COLLECTIONS_EMPTY === "1") {
    return [];
  }
  return INITIAL_COLLECTIONS.map((c) => ({ ...c, productIds: [...c.productIds] }));
}

type AgencyContact = {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string | null;
  note?: string | null;
  addedById: string;
  addedBy: string;
  addedDate: string;
};

function getInitialAgencyContacts(): AgencyContact[] {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PD_AGENCY_CONTACTS_EMPTY === "1") {
    return [];
  }
  return [
    {
      id: "ac-001",
      name: "Stéphane Laurent",
      role: "General Manager",
      email: "slaurent@aman.com",
      phone: "+33 1 42 22 00 11",
      note: "Mention TravelLustre — he knows us well.",
      addedById: "user-001",
      addedBy: "Constantin Chopin",
      addedDate: "2025-11-15",
    },
    {
      id: "ac-002",
      name: "Marie Duval",
      role: "Commission Contact",
      email: "marie.duval@aman.com",
      phone: null,
      note: null,
      addedById: "user-002",
      addedBy: "Sophie Martin",
      addedDate: "2026-01-08",
    },
    {
      id: "ac-003",
      name: "Julien Moreau",
      role: "Reservations Manager",
      email: "jmoreau@aman.com",
      phone: "+33 1 42 22 00 15",
      note: "Best reached by email — usually replies within 2h.",
      addedById: "user-001",
      addedBy: "Constantin Chopin",
      addedDate: "2026-02-20",
    },
  ];
}

function pinPosition(lat: number, lng: number) {
  const left = ((lng + 180) / 360) * 100;
  const top = ((90 - lat) / 180) * 100;
  return { left: `${left}%`, top: `${top}%` };
}

function markerColor(type: ProductType) {
  switch (type) {
    case "hotel":
      return "bg-blue-400";
    case "dmc":
      return "bg-emerald-400";
    case "experience":
      return "bg-amber-400";
    case "cruise":
      return "bg-violet-400";
    default:
      return "bg-gray-400";
  }
}

const MAP_CELL_W = 7;
const MAP_CELL_H = 9;

type MapPinItem =
  | { kind: "single"; product: DirectoryProduct; left: string; top: string }
  | { kind: "cluster"; products: DirectoryProduct[]; left: string; top: string };

/** Grid buckets nearby pins into one cluster marker (preview map). */
function clusterMapPins(products: DirectoryProduct[]): MapPinItem[] {
  const buckets = new Map<string, DirectoryProduct[]>();
  for (const p of products) {
    const { left, top } = pinPosition(p.latitude, p.longitude);
    const lx = parseFloat(left);
    const ty = parseFloat(top);
    const gx = Math.floor(lx / MAP_CELL_W);
    const gy = Math.floor(ty / MAP_CELL_H);
    const key = `${gx},${gy}`;
    const arr = buckets.get(key) ?? [];
    arr.push(p);
    buckets.set(key, arr);
  }
  const out: MapPinItem[] = [];
  for (const group of buckets.values()) {
    if (group.length === 1) {
      const pos = pinPosition(group[0].latitude, group[0].longitude);
      out.push({ kind: "single", product: group[0], ...pos });
    } else {
      let sl = 0;
      let st = 0;
      for (const p of group) {
        const pos = pinPosition(p.latitude, p.longitude);
        sl += parseFloat(pos.left);
        st += parseFloat(pos.top);
      }
      const n = group.length;
      out.push({
        kind: "cluster",
        products: group,
        left: `${sl / n}%`,
        top: `${st / n}%`,
      });
    }
  }
  return out;
}

export default function ProductDirectoryPage() {
  const toast = useToast();
  const { user } = useUser();
  const isAdmin = user?.role === "admin" || user?.role === "agency_admin";
  const currentUserId = user?.id != null ? String(user.id) : "user-janet";

  const [pageLoading, setPageLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [detailSkeleton, setDetailSkeleton] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [sharingCollectionId, setSharingCollectionId] = useState<string | null>(null);
  const [postingNote, setPostingNote] = useState(false);

  const [activeTab, setActiveTab] = useState<"collections" | "agency" | "enable">("collections");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [activeTypeFilters, setActiveTypeFilters] = useState<ProductType[]>([]);
  const [collections, setCollections] = useState<Collection[]>(getInitialCollections);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<DirectoryProduct | null>(null);
  const [saveForProductId, setSaveForProductId] = useState<string | null>(null);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [activeNoteLayer, setActiveNoteLayer] = useState<"advisor" | "agency">("advisor");
  const [advisorOverrides, setAdvisorOverrides] = useState({
    contact: "Marc (GM) — marc.dubois@aman.com — mention you are with TravelLustre",
    notes:
      "Pool area can get crowded in August. Request rooms in the east wing for quieter experience. Spa is world-class — always book the hammam for VICs.",
    personalRating: 4 as number,
  });
  const [agencyNotes, setAgencyNotes] = useState([
    {
      id: "an-001",
      content:
        "Partner program renewed for 2026. 15% commission on rack rate, complimentary upgrade on availability. Contact: partnerships@aman.com",
      author: "Kristin",
      authorId: "user-kristin",
      timeAgo: "1 month ago",
    },
    {
      id: "an-002",
      content:
        "Great for honeymoons and couples. Not ideal for families with young kids — no kids club, very serene atmosphere.",
      author: "Janet",
      authorId: "user-janet",
      timeAgo: "3 months ago",
    },
  ]);
  const [newAgencyNote, setNewAgencyNote] = useState("");
  const [mapSelected, setMapSelected] = useState<DirectoryProduct | null>(null);
  const [mapCluster, setMapCluster] = useState<DirectoryProduct[] | null>(null);
  const [agencyContacts, setAgencyContacts] = useState<AgencyContact[]>(getInitialAgencyContacts);
  const [agencyContactFormOpen, setAgencyContactFormOpen] = useState(false);
  const [newAgencyContactName, setNewAgencyContactName] = useState("");
  const [newAgencyContactRole, setNewAgencyContactRole] = useState("");
  const [newAgencyContactEmail, setNewAgencyContactEmail] = useState("");
  const [newAgencyContactPhone, setNewAgencyContactPhone] = useState("");
  const [newAgencyContactNote, setNewAgencyContactNote] = useState("");
  const [addingAgencyContact, setAddingAgencyContact] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setPageLoading(false), 400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (viewMode !== "map") return;
    setMapLoading(true);
    const t = window.setTimeout(() => setMapLoading(false), 500);
    return () => window.clearTimeout(t);
  }, [viewMode]);

  useEffect(() => {
    if (!detailProduct) {
      setDetailSkeleton(false);
      return;
    }
    setDetailSkeleton(true);
    const t = window.setTimeout(() => setDetailSkeleton(false), 350);
    return () => window.clearTimeout(t);
  }, [detailProduct?.id]);

  const partnerPrograms = [
    {
      id: "pp-001",
      name: "Virtuoso Preferred",
      benefits: "Room upgrade on availability, daily breakfast for 2, $100 hotel credit, early check-in / late check-out.",
      commission: "10% on rack rate",
      commissionContact: { name: "Marie Duval", email: "marie.duval@aman.com" },
      scope: TEAM_EVERYONE_ID,
      expires: "2026-12-31",
    },
    {
      id: "pp-002",
      name: "Aman Junkies Program",
      benefits: "Return guest recognition, complimentary spa treatment, dedicated host, priority reservations.",
      commission: null as string | null,
      commissionContact: null as { name: string; email: string } | null,
      scope: "enable" as const,
      expires: null as string | null,
    },
  ];

  const productById = useMemo(() => {
    const m = new Map<string, DirectoryProduct>();
    MOCK_PRODUCTS.forEach((p) => m.set(p.id, p));
    return m;
  }, []);

  const tabProducts = useMemo(() => {
    if (activeTab === "enable") return MOCK_PRODUCTS;
    if (activeTab === "agency") {
      if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PD_AGENCY_EMPTY === "1") return [];
      return MOCK_PRODUCTS.filter((p) => p.hasTeamData);
    }
    if (openCollectionId) {
      const col = collections.find((c) => c.id === openCollectionId);
      if (!col) return [];
      return col.productIds.map((id) => productById.get(id)).filter(Boolean) as DirectoryProduct[];
    }
    return [];
  }, [activeTab, openCollectionId, collections, productById]);

  const filteredProducts = useMemo(() => {
    let list = activeTab === "collections" && !openCollectionId ? [] : tabProducts;
    if (activeTab === "collections" && !openCollectionId) return list;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q)
      );
    }
    if (countryFilter) {
      list = list.filter((p) => p.country.toLowerCase() === countryFilter.toLowerCase());
    }
    if (activeTypeFilters.length) {
      list = list.filter((p) => activeTypeFilters.includes(p.type));
    }
    return list;
  }, [activeTab, openCollectionId, tabProducts, searchQuery, countryFilter, activeTypeFilters]);

  const hasListFilters = Boolean(
    searchQuery.trim() || countryFilter || activeTypeFilters.length > 0
  );
  const mapPinProducts = useMemo(
    () =>
      filteredProducts.filter(
        (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
      ),
    [filteredProducts]
  );

  const mapPinItems = useMemo(() => clusterMapPins(mapPinProducts), [mapPinProducts]);

  useEffect(() => {
    setMapSelected(null);
    setMapCluster(null);
  }, [mapPinProducts]);

  const toggleTypeFilter = (t: ProductType) => {
    setActiveTypeFilters((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const addToCollection = (collectionId: string, productId: string) => {
    const col = collections.find((c) => c.id === collectionId);
    setSavingProductId(productId);
    window.setTimeout(() => {
      setCollections((cols) =>
        cols.map((c) =>
          c.id === collectionId && !c.productIds.includes(productId)
            ? { ...c, productIds: [...c.productIds, productId] }
            : c
        )
      );
      toast(col ? `Added to ${col.name}` : "Added to collection");
      setSavingProductId(null);
      setSaveForProductId(null);
    }, 280);
  };

  const removeFromCollection = (collectionId: string, productId: string) => {
    setCollections((cols) =>
      cols.map((c) =>
        c.id === collectionId ? { ...c, productIds: c.productIds.filter((id) => id !== productId) } : c
      )
    );
  };

  const addAgencyContact = () => {
    const name = newAgencyContactName.trim();
    const role = newAgencyContactRole.trim();
    if (!name || !role || addingAgencyContact) return;
    setAddingAgencyContact(true);
    window.setTimeout(() => {
      const email = newAgencyContactEmail.trim();
      const phone = newAgencyContactPhone.trim();
      const note = newAgencyContactNote.trim();
      setAgencyContacts((c) => [
        ...c,
        {
          id: `agc-${Date.now()}`,
          name,
          role,
          email: email || undefined,
          phone: phone || null,
          note: note || null,
          addedById: currentUserId,
          addedBy: user?.username || "You",
          addedDate: new Date().toISOString().slice(0, 10),
        },
      ]);
      setNewAgencyContactName("");
      setNewAgencyContactRole("");
      setNewAgencyContactEmail("");
      setNewAgencyContactPhone("");
      setNewAgencyContactNote("");
      toast("Contact added");
      setAddingAgencyContact(false);
    }, 260);
  };

  const removeAgencyContact = (id: string) => {
    setAgencyContacts((c) => c.filter((x) => x.id !== id));
    toast("Contact deleted");
  };

  const createCollection = () => {
    const name = newName.trim();
    if (!name) return;
    const id = `col-${Date.now()}`;
    setCollections((c) => [
      ...c,
      {
        id,
        name,
        description: newDesc.trim() || undefined,
        scope: "private",
        ownerId: currentUserId,
        ownerName: user?.username?.split(" ")[0] || "You",
        productIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    setNewName("");
    setNewDesc("");
    setNewCollectionOpen(false);
    toast("Collection created");
  };

  const shareCollectionWithTeam = (collectionId: string, teamId: string) => {
    setSharingCollectionId(collectionId);
    window.setTimeout(() => {
      setCollections((cols) => cols.map((c) => (c.id === collectionId ? { ...c, scope: teamId } : c)));
      const t = MOCK_TEAMS.find((x) => x.id === teamId);
      toast(`Collection shared with ${t?.name ?? "team"}`);
      setSharingCollectionId(null);
    }, 320);
  };

  const deleteCollection = (collectionId: string) => {
    setCollections((cols) => cols.filter((c) => c.id !== collectionId));
    setOpenCollectionId(null);
    toast("Collection deleted");
  };

  const openCollection = collections.find((c) => c.id === openCollectionId);

  const ProductCard = ({ product, onRemove }: { product: DirectoryProduct; onRemove?: () => void }) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setDetailProduct(product)}
      onKeyDown={(e) => e.key === "Enter" && setDetailProduct(product)}
      className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 hover:bg-white/[0.04] cursor-pointer transition-colors relative"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{product.name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {product.hasTeamData && (
                <span className="w-2 h-2 rounded-full bg-blue-400" title="Team notes available" />
              )}
              {product.hasAdvisorNotes && (
                <span className="w-2 h-2 rounded-full bg-violet-400" title="You have notes on this" />
              )}
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {product.city}, {product.country}
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0",
            product.type === "hotel" && "text-blue-400 bg-blue-500/5 border-blue-500/10",
            product.type === "dmc" && "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
            product.type === "experience" && "text-amber-400 bg-amber-500/5 border-amber-500/10",
            product.type === "cruise" && "text-violet-400 bg-violet-500/5 border-violet-500/10"
          )}
        >
          {productTypes.find((t) => t.id === product.type)?.label}
        </span>
      </div>
      <div className="relative mt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSaveForProductId((id) => (id === product.id ? null : product.id));
          }}
          disabled={savingProductId === product.id}
          className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 disabled:opacity-50"
        >
          {savingProductId === product.id ? (
            <Spinner size="sm" />
          ) : (
            <Bookmark className="w-3 h-3" />
          )}
          Save
        </button>
        {saveForProductId === product.id && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 py-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider px-3 py-2">Save to collection</p>
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCollection(collection.id, product.id);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 flex items-center justify-between"
              >
                <span>{collection.name}</span>
                {collection.productIds.includes(product.id) && <Check className="w-3 h-3 text-blue-400" />}
              </button>
            ))}
            <div className="border-t border-white/[0.06] mt-1 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewCollectionOpen(true);
                  setSaveForProductId(null);
                }}
                className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-white/5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New Collection
              </button>
            </div>
          </div>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mt-2 text-[10px] text-red-400/80 hover:text-red-400"
        >
          Remove from collection
        </button>
      )}
    </div>
  );

  const canManageCollection = useCallback(
    (c: Collection) => isAdmin || c.ownerId === currentUserId,
    [isAdmin, currentUserId]
  );

  return (
    <div className="min-h-full bg-[#06060a] text-[#F5F5F5] p-6">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Product Directory" variant="full" dismissible sampleDataOnly />}
      <h1 className="text-xl font-semibold text-white mb-1">Product Directory</h1>
      <p className="text-sm text-gray-500 mb-6">Collections, agency library, and Enable-curated catalog.</p>

      <div className="flex items-center gap-1 bg-white/[0.03] rounded-full p-0.5 mb-6 w-fit">
        {(["collections", "agency", "enable"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setOpenCollectionId(null);
              setDetailProduct(null);
            }}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              activeTab === tab ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-400"
            )}
          >
            {tab === "collections" ? "Collections" : tab === "agency" ? "Agency Library" : "Enable Directory"}
          </button>
        ))}
      </div>

      {activeTab === "collections" && !openCollectionId && (
        <>
          {pageLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#161616]">
              <EmptyState
                icon={Bookmark}
                title="No collections yet"
                description="Create a collection to group and organize your favorite products."
                action={{ label: "+ New Collection", onClick: () => setNewCollectionOpen(true) }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setNewCollectionOpen(true)}
                className="border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-white/20 transition-colors min-h-[120px]"
              >
                <Plus className="w-5 h-5 text-gray-600" />
                <span className="text-xs text-gray-500">New Collection</span>
              </button>
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenCollectionId(collection.id)}
                  onKeyDown={(e) => e.key === "Enter" && setOpenCollectionId(collection.id)}
                  className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 hover:bg-white/[0.04] cursor-pointer transition-colors min-h-[120px] flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-white truncate">{collection.name}</span>
                    <ScopeBadge scope={collection.scope} teams={MOCK_TEAMS} className="flex-shrink-0" />
                  </div>
                  {collection.description && (
                    <p className="text-[10px] text-gray-500 mb-2 line-clamp-2">{collection.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-auto text-[10px] text-gray-600">
                    <span>{collection.productIds.length} products</span>
                  </div>
                  {collection.scope !== "private" && (
                    <span className="text-[10px] text-gray-600 mt-1">Created by {collection.ownerName}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "collections" && openCollection && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <button
                type="button"
                onClick={() => setOpenCollectionId(null)}
                className="text-[10px] text-gray-500 hover:text-gray-400 flex items-center gap-1 mb-2"
              >
                <ChevronLeft className="w-3 h-3" /> Back to Collections
              </button>
              <h2 className="text-lg font-semibold text-white">{openCollection.name}</h2>
              <span className="text-xs text-gray-500">{openCollection.productIds.length} products</span>
            </div>
            <div className="flex items-center gap-2">
              {openCollection.scope === "private" && canManageCollection(openCollection) && (
                <ShareWithTeamDropdown
                  teams={MOCK_TEAMS}
                  onSelect={(teamId) => shareCollectionWithTeam(openCollection.id, teamId)}
                  trigger={
                    <button
                      type="button"
                      disabled={sharingCollectionId === openCollection.id}
                      className="text-[10px] text-gray-500 hover:text-blue-400 flex items-center gap-1 disabled:opacity-50"
                    >
                      {sharingCollectionId === openCollection.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <Share2 className="w-3 h-3" />
                      )}{" "}
                      Share with…
                    </button>
                  }
                />
              )}
              {canManageCollection(openCollection) && (
                <button
                  type="button"
                  onClick={() => deleteCollection(openCollection.id)}
                  className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#161616]">
              <EmptyState
                icon={Bookmark}
                title="This collection is empty"
                description="Browse the Agency Library or Enable Directory and save products here."
                action={{
                  label: "Browse products →",
                  onClick: () => {
                    setOpenCollectionId(null);
                    setActiveTab("enable");
                  },
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onRemove={
                    canManageCollection(openCollection) || isAdmin
                      ? () => removeFromCollection(openCollection.id, product.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {(activeTab === "agency" || activeTab === "enable") && (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search products by name, location, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-xs bg-transparent text-gray-300 placeholder:text-gray-600 outline-none"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded", viewMode === "list" ? "bg-white/10 text-white" : "text-gray-600")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={cn("p-1.5 rounded", viewMode === "map" ? "bg-white/10 text-white" : "text-gray-600")}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {productTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleTypeFilter(type.id)}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full transition-all",
                    activeTypeFilters.includes(type.id)
                      ? `${type.color} bg-white/10 border border-white/10`
                      : "text-gray-500 bg-white/[0.03] border border-white/[0.04] hover:border-white/10"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="text-[10px] bg-white/[0.03] border border-white/[0.04] rounded-full px-3 py-1 text-gray-400 outline-none"
            >
              <option value="">All Countries</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {pageLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 8 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : viewMode === "list" ? (
            filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#161616]">
                {activeTab === "agency" && tabProducts.length === 0 && !hasListFilters ? (
                  <EmptyState
                    icon={Building2}
                    title="No enriched products yet"
                    description="When your team adds notes, partner programs, or contacts to products, they'll appear here."
                  />
                ) : (
                  <EmptyState
                    icon={Search}
                    title="No products match your filters"
                    description="Try broadening your search or removing some filters."
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )
          ) : mapLoading ? (
            <div className="w-full h-[480px] rounded-xl border border-white/[0.06] bg-[#0f1419] flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : mapPinProducts.length === 0 ? (
            <div className="w-full min-h-[480px] rounded-xl border border-white/[0.08] bg-[#161616] flex items-center">
              <EmptyState
                icon={MapIcon}
                title="No products to show on the map"
                description="The current filter has no products with location data. Try changing your filters."
              />
            </div>
          ) : (
            <div className="w-full h-[480px] rounded-xl overflow-hidden border border-white/[0.06] relative bg-gradient-to-b from-[#0f1419] to-[#06060a]">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(ellipse_at_70%_60%,rgba(139,92,246,0.12),transparent_45%)]" />
              <span className="absolute top-3 left-3 text-[10px] text-gray-500 z-10 max-w-[70%]">
                Map preview — pins by type; nearby pins cluster (click cluster to list)
              </span>
              {mapPinItems.map((item, idx) =>
                item.kind === "single" ? (
                  <button
                    key={item.product.id}
                    type="button"
                    title={item.product.name}
                    onClick={() => {
                      setMapSelected(item.product);
                      setMapCluster(null);
                    }}
                    className={cn(
                      "absolute w-3 h-3 rounded-full border-2 border-[#06060a] -translate-x-1/2 -translate-y-1/2 shadow-lg hover:scale-125 transition-transform z-[5]",
                      markerColor(item.product.type)
                    )}
                    style={{ left: item.left, top: item.top }}
                  />
                ) : (
                  <button
                    key={`cluster-${idx}-${item.products.map((p) => p.id).join("-")}`}
                    type="button"
                    title={`${item.products.length} products`}
                    onClick={() => {
                      setMapCluster(item.products);
                      setMapSelected(null);
                    }}
                    className="absolute z-[6] min-w-7 h-7 px-1 rounded-full border-2 border-[#06060a] -translate-x-1/2 -translate-y-1/2 shadow-lg bg-white/15 text-[10px] font-semibold text-white hover:bg-white/25 flex items-center justify-center"
                    style={{ left: item.left, top: item.top }}
                  >
                    {item.products.length}
                  </button>
                )
              )}
              {mapSelected && (
                <div className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:w-64 rounded-xl border border-white/10 bg-[#12121a]/95 p-3 text-left z-20">
                  <span className="text-xs font-medium text-white block">{mapSelected.name}</span>
                  <span className="text-[10px] text-gray-400 block">
                    {mapSelected.city}, {mapSelected.country}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] mt-1 inline-block",
                      mapSelected.type === "hotel" && "text-blue-400",
                      mapSelected.type === "dmc" && "text-emerald-400",
                      mapSelected.type === "experience" && "text-amber-400",
                      mapSelected.type === "cruise" && "text-violet-400"
                    )}
                  >
                    {productTypes.find((t) => t.id === mapSelected.type)?.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailProduct(mapSelected)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 block"
                  >
                    View details →
                  </button>
                </div>
              )}
              {mapCluster && mapCluster.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:max-w-sm rounded-xl border border-white/10 bg-[#12121a]/95 p-3 text-left z-20 max-h-48 overflow-y-auto">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2">
                    {mapCluster.length} products
                  </span>
                  <ul className="space-y-2">
                    {mapCluster.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailProduct(p);
                            setMapCluster(null);
                          }}
                          className="text-left w-full text-xs text-white hover:text-blue-300 truncate"
                        >
                          {p.name}
                          <span className="text-[10px] text-gray-500 block">
                            {p.city}, {p.country}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {newCollectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-xl p-5 max-w-md w-full space-y-3">
            <h3 className="text-sm font-medium text-white">New collection</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full text-xs bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 outline-none"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full text-xs bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 outline-none resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNewCollectionOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={createCollection}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {detailProduct && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50" onClick={() => setDetailProduct(null)}>
          <div
            className="w-full max-w-lg h-full bg-[#0a0a0f] border-l border-white/10 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-5">
              {detailSkeleton ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-white/[0.06] rounded w-3/4" />
                      <div className="h-3 bg-white/[0.05] rounded w-1/3" />
                    </div>
                    <div className="h-8 w-16 bg-white/[0.06] rounded" />
                  </div>
                  <div className="h-16 bg-white/[0.04] rounded-xl" />
                  <div className="h-28 bg-white/[0.04] rounded-xl border border-white/[0.06]" />
                  <div className="h-36 bg-white/[0.04] rounded-xl border border-white/[0.06]" />
                  <div className="h-4 bg-white/[0.06] rounded w-36" />
                  <div className="space-y-2">
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                </div>
              ) : (
                <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">{detailProduct.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {detailProduct.city}, {detailProduct.country}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDetailProduct(null)}>
                  Close
                </Button>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{detailProduct.description}</p>

              {!isAdmin && (
                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                  <Lock className="w-3 h-3" />
                  <span>Agency-level catalog — view only. You can add personal notes.</span>
                </div>
              )}

              {detailProduct.id === "prod-001" && (
                <>
                  <div className="border-t border-white/[0.06] pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-white">Notes & Details</span>
                      <div className="flex items-center gap-1 bg-white/[0.03] rounded-full p-0.5">
                        {(["advisor", "agency"] as const).map((layer) => (
                          <button
                            key={layer}
                            type="button"
                            onClick={() => setActiveNoteLayer(layer)}
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-medium transition-all",
                              activeNoteLayer === layer
                                ? layer === "advisor"
                                  ? "bg-violet-500/15 text-violet-400"
                                  : "bg-blue-500/15 text-blue-400"
                                : "text-gray-500 hover:text-gray-400"
                            )}
                          >
                            {layer === "advisor" ? "My Notes" : "Agency Notes"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {activeNoteLayer === "advisor" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Lock className="w-3 h-3 text-violet-400/50" />
                          <span className="text-[10px] text-violet-400/60">Only visible to you</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">My Contact</p>
                          <input
                            value={advisorOverrides.contact}
                            onChange={(e) => setAdvisorOverrides((o) => ({ ...o, contact: e.target.value }))}
                            className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">My Notes</p>
                          <textarea
                            value={advisorOverrides.notes}
                            onChange={(e) => setAdvisorOverrides((o) => ({ ...o, notes: e.target.value }))}
                            rows={3}
                            className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none resize-none"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">My Rating</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setAdvisorOverrides((o) => ({ ...o, personalRating: star }))}
                                className={cn(
                                  "w-5 h-5 text-xs",
                                  star <= advisorOverrides.personalRating ? "text-amber-400" : "text-gray-700"
                                )}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeNoteLayer === "agency" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Users className="w-3 h-3 text-blue-400/50" />
                          <span className="text-[10px] text-blue-400/60">Visible to all agency members</span>
                        </div>
                        <div className="space-y-2">
                          {agencyNotes.map((note) => (
                            <div
                              key={note.id}
                              className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]"
                            >
                              <p className="text-xs text-gray-300 leading-relaxed">{note.content}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-gray-500">{note.author}</span>
                                <span className="text-[10px] text-gray-600">·</span>
                                <span className="text-[10px] text-gray-600">{note.timeAgo}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={newAgencyNote}
                            onChange={(e) => setNewAgencyNote(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const t = newAgencyNote.trim();
                                if (!t) return;
                                setAgencyNotes((n) => [
                                  ...n,
                                  {
                                    id: `an-${Date.now()}`,
                                    content: t,
                                    author: user?.username || "You",
                                    authorId: currentUserId,
                                    timeAgo: "just now",
                                  },
                                ]);
                                setNewAgencyNote("");
                              }
                            }}
                            placeholder="Add a note for the agency..."
                            className="flex-1 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
                          />
                          <button
                            type="button"
                            disabled={postingNote}
                            onClick={() => {
                              const t = newAgencyNote.trim();
                              if (!t || postingNote) return;
                              setPostingNote(true);
                              window.setTimeout(() => {
                                setAgencyNotes((n) => [
                                  ...n,
                                  {
                                    id: `an-${Date.now()}`,
                                    content: t,
                                    author: user?.username || "You",
                                    authorId: currentUserId,
                                    timeAgo: "just now",
                                  },
                                ]);
                                setNewAgencyNote("");
                                toast("Note posted");
                                setPostingNote(false);
                              }, 280);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 px-3 disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {postingNote ? <Spinner size="sm" /> : null}
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/[0.06] pt-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">Partner Programs</span>
                      <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {partnerPrograms.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {partnerPrograms.map((program) => (
                        <div
                          key={program.id}
                          className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{program.name}</span>
                            {program.scope === "enable" ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                Enable
                              </span>
                            ) : (
                              <ScopeBadge scope={program.scope} teams={MOCK_TEAMS} />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">{program.benefits}</p>
                          {program.commission && (
                            <p className="text-[10px] text-amber-400/70 mt-0.5">Commission: {program.commission}</p>
                          )}
                          {"commissionContact" in program && program.commissionContact && (
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              Commission contact: {program.commissionContact.name} — {program.commissionContact.email}
                            </p>
                          )}
                          {program.expires && (
                            <p className="text-[10px] text-gray-600 mt-0.5">Expires: {program.expires}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-5">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Users className="w-3 h-3 text-blue-400/50" />
                      <span className="text-[10px] text-blue-400/60">Visible to all agency members</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">Agency contacts</span>
                        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                          {agencyContacts.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAgencyContactFormOpen(true)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3 h-3" /> Add contact
                      </button>
                    </div>
                    {agencyContacts.length === 0 ? (
                      <EmptyState
                        icon={UserPlus}
                        title="No contacts added yet"
                        description="Know someone here? Add a contact so the whole team knows who to reach out to."
                        className="py-10"
                        action={{
                          label: "+ Add Contact",
                          onClick: () => setAgencyContactFormOpen(true),
                        }}
                      />
                    ) : (
                      <div className="space-y-2">
                        {agencyContacts.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start justify-between gap-2 bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-medium text-white">{c.name}</p>
                                <span className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                                  {c.role}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                {c.email && (
                                  <a
                                    href={`mailto:${c.email}`}
                                    className="text-[10px] text-blue-400/70 hover:text-blue-400"
                                  >
                                    {c.email}
                                  </a>
                                )}
                                {c.phone && <span className="text-[10px] text-gray-500">{c.phone}</span>}
                              </div>
                              {c.note && <p className="text-[10px] text-gray-500 italic mt-1">{c.note}</p>}
                              <span className="text-[10px] text-gray-700 mt-1 block">
                                Added by {c.addedBy} · {c.addedDate}
                              </span>
                            </div>
                            {(isAdmin || c.addedById === currentUserId) && (
                              <button
                                type="button"
                                onClick={() => removeAgencyContact(c.id)}
                                className="text-[10px] text-red-400/80 hover:text-red-400 shrink-0"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {(agencyContactFormOpen || agencyContacts.length > 0) && (
                      <div className="mt-4 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Add contact</p>
                        <input
                          value={newAgencyContactName}
                          onChange={(e) => setNewAgencyContactName(e.target.value)}
                          placeholder="Name"
                          className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
                        />
                        <input
                          value={newAgencyContactRole}
                          onChange={(e) => setNewAgencyContactRole(e.target.value)}
                          placeholder="Role (required)"
                          className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
                        />
                        <input
                          value={newAgencyContactEmail}
                          onChange={(e) => setNewAgencyContactEmail(e.target.value)}
                          placeholder="Email (optional)"
                          className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
                        />
                        <input
                          value={newAgencyContactPhone}
                          onChange={(e) => setNewAgencyContactPhone(e.target.value)}
                          placeholder="Phone (optional)"
                          className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
                        />
                        <input
                          value={newAgencyContactNote}
                          onChange={(e) => setNewAgencyContactNote(e.target.value)}
                          placeholder="Note (optional)"
                          className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
                        />
                        <button
                          type="button"
                          disabled={
                            addingAgencyContact || !newAgencyContactName.trim() || !newAgencyContactRole.trim()
                          }
                          onClick={addAgencyContact}
                          className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {addingAgencyContact ? <Spinner size="sm" /> : null}
                          Save contact
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
