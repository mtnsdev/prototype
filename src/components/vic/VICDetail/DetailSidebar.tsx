"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Cake, Calendar, Plane } from "lucide-react";
import type { VIC } from "@/types/vic";
import { cn } from "@/lib/utils";

function formatDate(iso: string | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

function daysFromToday(iso: string | undefined): number | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.floor((d.getTime() - t.getTime()) / (24 * 60 * 60 * 1000));
  } catch {
    return null;
  }
}

function isBirthdayWithin14Days(vic: VIC): boolean {
  const dob = vic.date_of_birth;
  if (!dob) return false;
  try {
    const birth = new Date(dob);
    const today = new Date();
    const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    const diff = (thisYear.getTime() - today.getTime()) / (24 * 60 * 60 * 1000);
    return diff >= 0 && diff <= 14;
  } catch {
    return false;
  }
}

type Props = {
  vic: VIC;
  className?: string;
  onShowTravelProfiles?: () => void;
};

export default function DetailSidebar({ vic, className, onShowTravelProfiles }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const advisorName = vic.assigned_advisor_name ?? vic.assigned_advisor_id ?? "—";
  const clientSince = vic.client_since ? formatDate(vic.client_since) ?? vic.client_since : "—";
  const status = vic.relationship_status?.replace(/_/g, " ") ?? "—";
  const tags = vic.tags ?? [];

  const passportDays = daysFromToday(vic.passport_expiry);
  const passportWarning = passportDays != null && passportDays < 180 && passportDays >= 0;
  const birthdaySoon = isBirthdayWithin14Days(vic);

  const editHistory = (vic as { edit_history?: { by: string; at: string; change: string }[] }).edit_history ?? [];
  const recentActivity = editHistory.slice(0, 5);

  return (
    <aside
      className={cn(
        "rounded-xl border border-border bg-[rgba(255,255,255,0.03)] overflow-hidden",
        "lg:min-w-[240px] lg:max-w-[280px] lg:shrink-0",
        className
      )}
    >
      {/* Collapsible header on small screens */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left lg:hidden border-b border-border"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick info & alerts</span>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      <div className={cn("px-4 py-3 space-y-4", collapsed && "max-lg:hidden")}>
        {onShowTravelProfiles != null && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">Travel profiles</h3>
            <button
              type="button"
              onClick={onShowTravelProfiles}
              className="flex items-center gap-2 w-full text-left text-sm text-[rgba(245,245,245,0.85)] hover:text-foreground hover:bg-white/[0.04] rounded-lg px-2 py-1.5 -mx-2 transition-colors"
            >
              <Plane size={14} className="text-muted-foreground/75 shrink-0" />
              <span>{(vic.travel_profiles?.length ?? 0)} of 7 profile types</span>
            </button>
          </div>
        )}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">Quick info</h3>
          <ul className="space-y-1.5 text-sm text-[rgba(245,245,245,0.85)]">
            <li><span className="text-muted-foreground/75">Advisor:</span> {advisorName}</li>
            <li><span className="text-muted-foreground/75">Client since:</span> {clientSince}</li>
            <li>
              <span className="text-muted-foreground/75">Status:</span>{" "}
              <span className={cn(
                "capitalize",
                vic.relationship_status === "active" && "text-[var(--muted-success-text)]",
                vic.relationship_status === "inactive" && "text-muted-foreground",
                vic.relationship_status === "prospect" && "text-[var(--muted-info-text)]"
              )}>{status}</span>
            </li>
            {tags.length > 0 && (
              <li className="flex flex-wrap gap-1 pt-0.5">
                {tags.slice(0, 4).map((t) => (
                  <span key={t} className="text-xs lowercase border border-border text-muted-foreground/90 rounded-full px-2 py-0.5">{t}</span>
                ))}
              </li>
            )}
          </ul>
        </div>

        {(passportWarning || birthdaySoon) && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">Alerts</h3>
            <ul className="space-y-1.5 text-sm">
              {passportWarning && (
                <li className="flex items-center gap-2 text-[var(--muted-amber-text)]">
                  <AlertCircle size={14} />
                  Passport expires in {passportDays} days
                </li>
              )}
              {birthdaySoon && (
                <li className="flex items-center gap-2 text-[rgba(245,245,245,0.85)]">
                  <Cake size={14} />
                  Birthday coming up
                </li>
              )}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">Recent activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground/75">No recent changes</p>
          ) : (
            <ul className="space-y-2 text-xs text-muted-foreground">
              {recentActivity.map((e, i) => (
                <li key={i} className="flex gap-1.5">
                  <Calendar size={12} className="shrink-0 mt-0.5 text-muted-foreground/55" />
                  <span>{e.change ?? "Updated"} — {e.by} · {e.at ? formatDate(e.at) ?? e.at : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
