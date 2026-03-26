"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Share2, Play, ChevronDown, Loader2 } from "lucide-react";
import type { VIC } from "@/types/vic";
import { fetchVIC, getVICId, triggerAcuitySingle } from "@/lib/vic-api";
import { FAKE_VICS } from "../fakeData";
import { useUser } from "@/contexts/UserContext";
import { canEditVIC, canDeleteVIC, canShareVIC, canViewSensitiveFields } from "@/utils/vicPermissions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DetailTabBar, { type DetailTabId } from "./DetailTabBar";
import DetailTabContent from "./DetailTabContent";
import DetailSidebar from "./DetailSidebar";
import DeleteConfirmModal from "../Modals/DeleteConfirmModal";
import AddEditVICModal from "../Modals/AddEditVICModal";
import ShareVICModal from "../Modals/ShareVICModal";
import TravelProfileModal from "../Modals/TravelProfileModal";
import type { TravelProfile } from "@/types/vic";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

const VALID_TABS: DetailTabId[] = ["overview", "identity", "relationship", "preferences", "linked_entities", "sharing", "governance"];

type Props = { vicId: string };

export default function VICDetailPage({ vicId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const tabParam = searchParams.get("tab") as DetailTabId | string | null;
  const activeTab: DetailTabId =
    tabParam && VALID_TABS.includes(tabParam as DetailTabId) ? (tabParam as DetailTabId) : "overview";
  const openTravelFromQuery = tabParam === "travel";

  const [vic, setVic] = useState<VIC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [acuityRunning, setAcuityRunning] = useState(false);
  const [travelModalOpen, setTravelModalOpen] = useState(false);
  const [travelProfilesOverride, setTravelProfilesOverride] = useState<TravelProfile[] | null>(null);
  const [showTravelProfiles, setShowTravelProfiles] = useState(false);
  const travelSectionRef = useRef<HTMLDivElement>(null);

  const setTab = (tab: DetailTabId) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", tab);
    router.replace(`/dashboard/vics/${vicId}?${next.toString()}`, { scroll: false });
  };

  const load = async () => {
    if (!vicId) return;
    setLoading(true);
    setError(null);
    try {
      const v = await fetchVIC(vicId);
      setVic(v);
    } catch (err) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        const fake = FAKE_VICS.find((f) => getVICId(f) === vicId);
        if (fake) {
          setVic(fake);
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to load VIC");
      setVic(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [vicId]);

  useEffect(() => {
    if (openTravelFromQuery && vic) {
      setShowTravelProfiles(true);
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("tab", "overview");
      router.replace(`/dashboard/vics/${vicId}?${next.toString()}`, { scroll: false });
      setTimeout(() => travelSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [openTravelFromQuery, vic, vicId, router, searchParams]);

  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;
  const canEdit = vic ? canEditVIC(currentUser, vic) : false;
  const canDelete = vic ? canDeleteVIC(currentUser, vic) : false;
  const canShare = vic ? canShareVIC(currentUser, vic) : false;
  const canViewSensitive = vic ? canViewSensitiveFields(currentUser, vic) : false;

  const handleRunAcuity = async (_mode?: "full" | "quick" | "selective") => {
    if (!vic) return;
    setAcuityRunning(true);
    try {
      await triggerAcuitySingle(getVICId(vic));
      load();
    } catch {
      // Mock or API error — ignore for now
    } finally {
      setAcuityRunning(false);
    }
  };

  const acuityLastRun = vic?.acuity_last_run ?? (vic as unknown as { acuityLastRun?: string })?.acuityLastRun;
  const acuityStatus = vic?.acuity_status ?? (vic as unknown as { acuityStatus?: string })?.acuityStatus;
  const acuityDaysAgo = acuityLastRun
    ? Math.floor((Date.now() - new Date(acuityLastRun).getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const acuityStatusColor =
    acuityRunning
      ? "text-[var(--muted-info-text)]"
      : acuityDaysAgo == null
        ? "text-[rgba(245,245,245,0.5)]"
        : acuityDaysAgo <= 7
          ? "text-[var(--muted-success-text)]"
          : acuityDaysAgo <= 30
            ? "text-[var(--muted-amber-text)]"
            : "text-[var(--muted-error-text)]";
  const acuityStatusText = acuityRunning
    ? "Acuity: Running…"
    : acuityDaysAgo != null
      ? "Acuity: Last run " + acuityDaysAgo + " day" + (acuityDaysAgo === 1 ? "" : "s") + " ago"
      : "Acuity: Not yet run";

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    router.push("/dashboard/vics");
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[#08080c]">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-9 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-9 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 h-40 animate-pulse" />
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 h-24 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !vic) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-[var(--muted-error-bg)] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-[var(--muted-error-text)]">!</span>
          </div>
          <h2 className="text-lg font-semibold text-[#F5F5F5] mb-2">VIC not found</h2>
          <p className="text-sm text-[rgba(245,245,245,0.6)] mb-4">{error ?? "This VIC may have been removed or you don’t have access."}</p>
          <Link href="/dashboard/vics" className="inline-flex items-center gap-2 text-sm text-[rgba(245,245,245,0.8)] hover:text-[#F5F5F5]">
            <ArrowLeft size={16} />
            Back to VICs
          </Link>
        </div>
      </div>
    );
  }

  const leg = vic as unknown as { city?: string; country?: string; company?: string; role?: string; customTags?: string[] };
  const location = [vic.home_city ?? leg.city, vic.home_country ?? leg.country].filter(Boolean).join(", ");
  const companyRole = [leg.company, leg.role].filter(Boolean).join(" · ");
  const line2Parts = [
    vic.preferred_name && vic.preferred_name !== vic.full_name ? `Preferred: ${vic.preferred_name}` : null,
    location,
    companyRole,
  ].filter(Boolean);

  return (
    <div className="h-full overflow-y-auto bg-[#08080c]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="VIC Profile" variant="compact" sampleDataOnly />}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Link
          href="/dashboard/vics"
          className="inline-flex items-center gap-2 text-sm text-[rgba(245,245,245,0.6)] hover:text-[#F5F5F5]"
        >
          <ArrowLeft size={16} />
          Back to VICs
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <ImageWithFallback fallbackType="avatar" alt={vic.full_name ?? "VIC"} name={vic.full_name ?? "?"} className="w-16 h-16 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-[#F5F5F5] tracking-tight">{vic.full_name}</h1>
            {line2Parts.length > 0 && (
              <p className="text-sm text-[rgba(245,245,245,0.55)] mt-1">
                {line2Parts.join(" · ")}
              </p>
            )}
            <p className={"text-xs mt-1 " + acuityStatusColor}>{acuityStatusText}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditModalOpen(true)} title="Edit">
                <Pencil size={16} className="text-[rgba(245,245,245,0.8)]" />
              </Button>
            )}
            {canShare && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShareModalOpen(true)} title="Share">
                <Share2 size={16} className="text-[rgba(245,245,245,0.8)]" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[rgba(245,245,245,0.8)]"
                  disabled={acuityRunning}
                  title="Run Acuity"
                >
                  {acuityRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Run Acuity
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRunAcuity("full")}>Full Profile Refresh</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRunAcuity("quick")}>Quick Update (fields &gt;30d)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRunAcuity("selective")}>Selective…</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--muted-error-text)] hover:opacity-80"
                onClick={() => setDeleteModalOpen(true)}
                title="Delete"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="min-w-0 flex-1 space-y-4">
            <DetailTabBar activeTab={activeTab} onTabChange={setTab} />
            <DetailTabContent
              vic={vic}
              activeTab={activeTab}
              canViewSensitive={canViewSensitive}
              onUpdate={load}
              travelProfiles={travelProfilesOverride ?? vic.travel_profiles ?? undefined}
              onAddTravelProfile={() => setTravelModalOpen(true)}
              showTravelProfiles={showTravelProfiles}
              onShowTravelProfilesChange={setShowTravelProfiles}
              travelSectionRef={travelSectionRef}
            />
          </div>
          <DetailSidebar
            vic={vic}
            className="lg:order-2 order-first"
            onShowTravelProfiles={() => {
              setShowTravelProfiles(true);
              if (activeTab !== "overview") {
                const next = new URLSearchParams(searchParams?.toString() ?? "");
                next.set("tab", "overview");
                router.replace(`/dashboard/vics/${vicId}?${next.toString()}`, { scroll: false });
              }
              setTimeout(() => travelSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }}
          />
        </div>
      </div>

      {deleteModalOpen && (
        <DeleteConfirmModal
          vic={vic}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteSuccess}
        />
      )}
      {editModalOpen && (
        <AddEditVICModal
          vic={vic}
          onClose={() => setEditModalOpen(false)}
          onSaved={() => {
            setEditModalOpen(false);
            load();
          }}
        />
      )}
      {shareModalOpen && vic && (
        <ShareVICModal
          vic={vic}
          onClose={() => setShareModalOpen(false)}
          onSaved={() => {
            setShareModalOpen(false);
            load();
          }}
        />
      )}
      {travelModalOpen && vic && (
        <TravelProfileModal
          vic={vic}
          existingTypes={(travelProfilesOverride ?? vic.travel_profiles ?? []).map((p) => p.profile_type)}
          onClose={() => setTravelModalOpen(false)}
          onSave={(profile) => {
            setTravelProfilesOverride((prev) => [...(prev ?? vic.travel_profiles ?? []), profile]);
            setTravelModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
